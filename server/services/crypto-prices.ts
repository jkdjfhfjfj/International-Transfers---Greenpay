import fetch from "node-fetch";
import { eq } from "drizzle-orm";
import { apiConfigurations } from "@shared/schema";
import { db, pool } from "../db";

export const SUPPORTED_CRYPTO_COINS = ["BTC", "ETH", "USDT", "USDC"] as const;
export type SupportedCryptoCoin = (typeof SUPPORTED_CRYPTO_COINS)[number];

const COINGECKO_IDS: Record<SupportedCryptoCoin, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
};

const FALLBACK_PRICES: Record<SupportedCryptoCoin, number> = {
  BTC: 65000,
  ETH: 3200,
  USDT: 1,
  USDC: 1,
};

export type CryptoPriceSnapshot = {
  prices: Record<SupportedCryptoCoin, number>;
  changes24h: Partial<Record<SupportedCryptoCoin, number>>;
  fetchedAt: string;
  source: "coingecko" | "binance" | "coincap" | "cryptocompare" | "cache" | "fallback";
  stale: boolean;
};

let cachedSnapshot: CryptoPriceSnapshot | null = null;
let requestInFlight: Promise<CryptoPriceSnapshot> | null = null;
const CACHE_TTL_MS = 60_000;

async function getFallbackPrices(): Promise<Record<SupportedCryptoCoin, number>> {
  const prices = { ...FALLBACK_PRICES };
  if (!pool) return prices;
  try {
    const result = await pool.query(
      `SELECT key, value FROM system_settings WHERE category = 'crypto_price_fallback'`,
    );
    for (const row of result.rows) {
      const coin = String(row.key || "").toUpperCase() as SupportedCryptoCoin;
      if (!SUPPORTED_CRYPTO_COINS.includes(coin)) continue;
      const raw = row.value;
      const value = Number(typeof raw === "object" && raw !== null ? raw.value : String(raw ?? "").replace(/^"|"$/g, ""));
      if (Number.isFinite(value) && value > 0) prices[coin] = value;
    }
  } catch {
    // Keep the safe in-code defaults when settings are unavailable.
  }
  return prices;
}

async function getConfiguredApiKey(providers: string[]): Promise<string | undefined> {
  if (!db) return undefined;
  try {
    const configurations: any[] = await db.select().from(apiConfigurations);
    const normalizedProviders = providers.map((provider) => provider.toLowerCase());
    const configuration = configurations.find(
      (item) =>
        item.isEnabled !== false &&
        normalizedProviders.includes(String(item.provider || "").toLowerCase()) &&
        item.apiKey,
    );
    return configuration?.apiKey || undefined;
  } catch {
    return undefined;
  }
}

async function getEnabledProviders(): Promise<Set<string>> {
  const enabled = new Set(["coingecko", "binance", "coincap", "cryptocompare"]);
  if (!db) return enabled;
  try {
    const configurations: any[] = await db.select().from(apiConfigurations);
    for (const configuration of configurations) {
      if (configuration?.provider && configuration.isEnabled === false) {
        enabled.delete(String(configuration.provider).toLowerCase());
      }
    }
  } catch {
    // Provider defaults remain enabled when settings cannot be read.
  }
  return enabled;
}

function makeSnapshot(
  prices: Record<SupportedCryptoCoin, number>,
  changes24h: Partial<Record<SupportedCryptoCoin, number>>,
  source: CryptoPriceSnapshot["source"],
): CryptoPriceSnapshot {
  return {
    prices,
    changes24h,
    fetchedAt: new Date().toISOString(),
    source,
    stale: false,
  };
}

async function fetchCoinGecko(apiKey?: string): Promise<CryptoPriceSnapshot> {
  const ids = SUPPORTED_CRYPTO_COINS.map((coin) => COINGECKO_IDS[coin]).join(",");
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    { headers: apiKey ? { "x-cg-demo-api-key": apiKey } : undefined },
  );
  if (!response.ok) {
    throw new Error(`CoinGecko returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as Record<
    string,
    { usd?: number; usd_24h_change?: number }
  >;
  const prices = { ...FALLBACK_PRICES };
  const changes24h: Partial<Record<SupportedCryptoCoin, number>> = {};

  for (const coin of SUPPORTED_CRYPTO_COINS) {
    const quote = payload[COINGECKO_IDS[coin]];
    if (!quote || typeof quote.usd !== "number" || !Number.isFinite(quote.usd)) {
      throw new Error(`CoinGecko did not return a valid ${coin} price`);
    }
    prices[coin] = quote.usd;
    if (typeof quote.usd_24h_change === "number" && Number.isFinite(quote.usd_24h_change)) {
      changes24h[coin] = quote.usd_24h_change;
    }
  }

  return makeSnapshot(prices, changes24h, "coingecko");
}

async function fetchCoinCap(apiKey?: string): Promise<CryptoPriceSnapshot> {
  const response = await fetch("https://api.coincap.io/v2/assets?ids=bitcoin,ethereum,tether,usd-coin", {
    headers: apiKey ? { authorization: `Bearer ${apiKey}` } : undefined,
  });
  if (!response.ok) throw new Error(`CoinCap returned HTTP ${response.status}`);
  const payload = (await response.json()) as { data?: Array<{ id: string; priceUsd?: string; changePercent24Hr?: string }> };
  const rows = new Map((payload.data || []).map((row) => [row.id, row]));
  const ids: Record<SupportedCryptoCoin, string> = { BTC: "bitcoin", ETH: "ethereum", USDT: "tether", USDC: "usd-coin" };
  const prices = { ...FALLBACK_PRICES };
  const changes24h: Partial<Record<SupportedCryptoCoin, number>> = {};
  for (const coin of SUPPORTED_CRYPTO_COINS) {
    const row = rows.get(ids[coin]);
    const price = Number(row?.priceUsd);
    if (!Number.isFinite(price)) throw new Error(`CoinCap did not return a valid ${coin} price`);
    prices[coin] = price;
    const change = Number(row?.changePercent24Hr);
    if (Number.isFinite(change)) changes24h[coin] = change;
  }
  return makeSnapshot(prices, changes24h, "coincap");
}

async function fetchBinance(apiKey?: string): Promise<CryptoPriceSnapshot> {
  const symbols = ["BTCUSDT", "ETHUSDT", "USDTUSDT", "USDCUSDT"];
  const response = await fetch(
    `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`,
    { headers: apiKey ? { "X-MBX-APIKEY": apiKey } : undefined },
  );
  if (!response.ok) throw new Error(`Binance returned HTTP ${response.status}`);
  const payload = (await response.json()) as Array<{ symbol: string; lastPrice?: string; priceChangePercent?: string }>;
  const rows = new Map(payload.map((row) => [row.symbol, row]));
  const prices = {
    BTC: Number(rows.get("BTCUSDT")?.lastPrice),
    ETH: Number(rows.get("ETHUSDT")?.lastPrice),
    USDT: Number(rows.get("USDTUSDT")?.lastPrice) || 1,
    USDC: Number(rows.get("USDCUSDT")?.lastPrice) || 1,
  } as Record<SupportedCryptoCoin, number>;
  if (!Number.isFinite(prices.BTC) || !Number.isFinite(prices.ETH)) throw new Error("Binance did not return all required prices");
  const changes24h: Partial<Record<SupportedCryptoCoin, number>> = {};
  for (const coin of SUPPORTED_CRYPTO_COINS) {
    const change = Number(rows.get(`${coin}USDT`)?.priceChangePercent);
    if (Number.isFinite(change)) changes24h[coin] = change;
  }
  return makeSnapshot(prices, changes24h, "binance");
}

async function fetchCryptoCompare(apiKey?: string): Promise<CryptoPriceSnapshot> {
  const response = await fetch(
    "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC,ETH,USDT,USDC&tsyms=USD",
    { headers: apiKey ? { authorization: `Apikey ${apiKey}` } : undefined },
  );
  if (!response.ok) throw new Error(`CryptoCompare returned HTTP ${response.status}`);
  const payload = (await response.json()) as { RAW?: Record<string, { USD?: { PRICE?: number; CHANGEPCT24HOUR?: number } }> };
  const prices = { ...FALLBACK_PRICES };
  const changes24h: Partial<Record<SupportedCryptoCoin, number>> = {};
  for (const coin of SUPPORTED_CRYPTO_COINS) {
    const quote = payload.RAW?.[coin]?.USD;
    if (!quote || !Number.isFinite(quote.PRICE)) throw new Error(`CryptoCompare did not return a valid ${coin} price`);
    prices[coin] = quote.PRICE!;
    if (Number.isFinite(quote.CHANGEPCT24HOUR)) changes24h[coin] = quote.CHANGEPCT24HOUR;
  }
  return makeSnapshot(prices, changes24h, "cryptocompare");
}

async function fetchLivePrices(): Promise<CryptoPriceSnapshot> {
  // Always load the configured fallback before trying providers. If every
  // provider is unavailable, the same response still contains usable rates
  // rather than making the wallet endpoint fail.
  const fallbackPrices = await getFallbackPrices();
  const coinGeckoKey = await getConfiguredApiKey(["coingecko", "crypto_prices"]);
  const binanceKey = await getConfiguredApiKey(["binance"]);
  const coinCapKey = await getConfiguredApiKey(["coincap"]);
  const cryptoCompareKey = await getConfiguredApiKey(["cryptocompare"]);
  const enabled = await getEnabledProviders();
  const allProviders: Array<[string, () => Promise<CryptoPriceSnapshot>]> = [
    ["coingecko", () => fetchCoinGecko(coinGeckoKey)],
    ["binance", () => fetchBinance(binanceKey)],
    ["coincap", () => fetchCoinCap(coinCapKey)],
    ["cryptocompare", () => fetchCryptoCompare(cryptoCompareKey)],
  ];
  const providers = allProviders.filter(([provider]) => enabled.has(provider));
  for (const [, provider] of providers) {
    try {
      return await provider();
    } catch (error) {
      console.warn(`[Crypto prices] Provider failed: ${error instanceof Error ? error.message : error}`);
    }
  }
  return { ...makeSnapshot(fallbackPrices, {}, "fallback"), stale: true };
}

export function invalidateCryptoPriceCache() {
  cachedSnapshot = null;
}

export async function getCryptoPrices(): Promise<CryptoPriceSnapshot> {
  if (cachedSnapshot && Date.now() - Date.parse(cachedSnapshot.fetchedAt) < CACHE_TTL_MS) {
    return cachedSnapshot;
  }
  if (requestInFlight) return requestInFlight;

  requestInFlight = fetchLivePrices()
    .then((snapshot) => {
      cachedSnapshot = snapshot;
      return snapshot;
    })
    .catch(async (error) => {
      console.warn(`[Crypto prices] Live price request failed: ${error instanceof Error ? error.message : error}`);
      if (cachedSnapshot) {
        return { ...cachedSnapshot, source: "cache" as const, stale: true };
      }
      return {
        prices: await getFallbackPrices(),
        changes24h: {},
        fetchedAt: new Date().toISOString(),
        source: "fallback" as const,
        stale: true,
      };
    })
    .finally(() => {
      requestInFlight = null;
    });

  return requestInFlight;
}

export async function getCryptoPrice(coin: string): Promise<number | undefined> {
  const normalizedCoin = coin.trim().toUpperCase() as SupportedCryptoCoin;
  if (!SUPPORTED_CRYPTO_COINS.includes(normalizedCoin)) return undefined;
  const snapshot = await getCryptoPrices();
  return snapshot.prices[normalizedCoin];
}