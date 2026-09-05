import fetch from "node-fetch";

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
  source: "coingecko" | "cache" | "fallback";
  stale: boolean;
};

let cachedSnapshot: CryptoPriceSnapshot | null = null;
let requestInFlight: Promise<CryptoPriceSnapshot> | null = null;
const CACHE_TTL_MS = 60_000;

async function fetchLivePrices(): Promise<CryptoPriceSnapshot> {
  const ids = SUPPORTED_CRYPTO_COINS.map((coin) => COINGECKO_IDS[coin]).join(",");
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    { timeout: 8_000 },
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

  return {
    prices,
    changes24h,
    fetchedAt: new Date().toISOString(),
    source: "coingecko",
    stale: false,
  };
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
    .catch((error) => {
      console.warn(`[Crypto prices] Live price request failed: ${error instanceof Error ? error.message : error}`);
      if (cachedSnapshot) {
        return { ...cachedSnapshot, source: "cache" as const, stale: true };
      }
      return {
        prices: { ...FALLBACK_PRICES },
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