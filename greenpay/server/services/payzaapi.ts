import fetch from "node-fetch";
import { createHmac, timingSafeEqual } from "node:crypto";

const PAYZA_BASE_URL = "https://payzaapi.co.ke";

type PayzaKeys = { publicKey: string; secretKey: string };

export const PAYZA_API_CURRENCIES = [
  { code: "KES", providerCode: "KES", name: "Kenyan Shilling", countryOrRegion: "Kenya" },
  { code: "NGN", providerCode: "NGN", name: "Nigerian Naira", countryOrRegion: "Nigeria" },
  { code: "GHS", providerCode: "GHS", name: "Ghanaian Cedi", countryOrRegion: "Ghana" },
  { code: "TZS", providerCode: "TZS", name: "Tanzanian Shilling", countryOrRegion: "Tanzania" },
  { code: "XOF", providerCode: "XOF", name: "West African CFA franc", countryOrRegion: "West African CFA currency region" },
  { code: "USD", providerCode: "USD", name: "US Dollar", countryOrRegion: "US dollar currency" },
  { code: "RWF", providerCode: "RWF", name: "Rwandan Franc", countryOrRegion: "Rwanda" },
  { code: "UGX", providerCode: "UGX", name: "Ugandan Shilling", countryOrRegion: "Uganda" },
  { code: "ZMW", providerCode: "ZMW", name: "Zambian Kwacha", countryOrRegion: "Zambia" },
  { code: "MWK", providerCode: "MWK", name: "Malawian Kwacha", countryOrRegion: "Malawi" },
  { code: "SLE", providerCode: "SLL", name: "Sierra Leonean Leone", countryOrRegion: "Sierra Leone" },
  { code: "CDF", providerCode: "CDF", name: "Congolese Franc", countryOrRegion: "Democratic Republic of the Congo" },
  { code: "MZN", providerCode: "MZN", name: "Mozambican Metical", countryOrRegion: "Mozambique" },
  { code: "XAF", providerCode: "XAF", name: "Central African CFA franc", countryOrRegion: "Central African CFA currency region" },
] as const;

const PAYZA_COUNTRY_CURRENCY: Record<string, string> = {
  KE: "KES",
  KENYA: "KES",
  NG: "NGN",
  NIGERIA: "NGN",
  GH: "GHS",
  GHANA: "GHS",
  TZ: "TZS",
  TANZANIA: "TZS",
  BJ: "XOF",
  BENIN: "XOF",
  BF: "XOF",
  "BURKINA FASO": "XOF",
  CI: "XOF",
  "COTE D IVOIRE": "XOF",
  "IVORY COAST": "XOF",
  GW: "XOF",
  "GUINEA BISSAU": "XOF",
  ML: "XOF",
  MALI: "XOF",
  NE: "XOF",
  NIGER: "XOF",
  SN: "XOF",
  SENEGAL: "XOF",
  TG: "XOF",
  TOGO: "XOF",
  US: "USD",
  USA: "USD",
  "UNITED STATES": "USD",
  RW: "RWF",
  RWANDA: "RWF",
  UG: "UGX",
  UGANDA: "UGX",
  ZM: "ZMW",
  ZAMBIA: "ZMW",
  MW: "MWK",
  MALAWI: "MWK",
  SL: "SLE",
  "SIERRA LEONE": "SLE",
  CD: "CDF",
  "DEMOCRATIC REPUBLIC OF THE CONGO": "CDF",
  "DR CONGO": "CDF",
  "CONGO KINSHASA": "CDF",
  MZ: "MZN",
  MOZAMBIQUE: "MZN",
  CM: "XAF",
  CAMEROON: "XAF",
  TD: "XAF",
  CHAD: "XAF",
  CF: "XAF",
  "CENTRAL AFRICAN REPUBLIC": "XAF",
  CG: "XAF",
  "REPUBLIC OF THE CONGO": "XAF",
  "CONGO BRAZZAVILLE": "XAF",
  GA: "XAF",
  GABON: "XAF",
  GQ: "XAF",
  "EQUATORIAL GUINEA": "XAF",
};

function countryKey(country: unknown): string {
  return String(country || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

export function isKenyanCountry(country: unknown): boolean {
  const key = countryKey(country);
  return key === "KE" || key === "KENYA" || key === "REPUBLIC OF KENYA";
}

/**
 * Resolve profile country to PayzaAPI's supported checkout currency.
 * USD is the supported cross-border checkout currency for countries without
 * a listed local currency; an empty country remains unresolved.
 */
export function getPayzaCurrencyForCountry(country: unknown): string | undefined {
  const key = countryKey(country);
  if (!key) return undefined;
  return PAYZA_COUNTRY_CURRENCY[key] || "USD";
}

export function getPayzaApiCurrencyCode(currency: string): string | undefined {
  return PAYZA_API_CURRENCIES.find(item => item.code === currency.toUpperCase())?.providerCode;
}

export function verifyPayzaWebhookSignature(
  rawBody: string,
  signature: string,
  secret = String(process.env.PAYZA_WEBHOOK_SECRET || "").trim(),
): boolean {
  const normalizedSignature = String(signature || "").trim();
  if (!secret || !/^[a-f\d]{64}$/i.test(normalizedSignature)) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const received = Buffer.from(normalizedSignature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export class PayzaApiService {
  private async getKeys(): Promise<PayzaKeys | null> {
    const keys = {
      publicKey: String(process.env.PAYZA_PUBLIC_KEY || "").trim(),
      secretKey: String(process.env.PAYZA_SECRET_KEY || "").trim(),
    };
    return keys.publicKey && keys.secretKey ? keys : null;
  }

  private headers(keys: PayzaKeys) {
    return {
      "Content-Type": "application/json",
      "X-Public-Key": keys.publicKey,
      "X-Secret-Key": keys.secretKey,
    };
  }

  async initializePayment(params: {
    amount: number;
    currency: string;
    reference: string;
    email: string;
    name?: string;
    phone?: string;
    callbackUrl: string;
    redirectUrl?: string;
    cancelUrl?: string;
    description?: string;
    metadata?: Record<string, unknown>;
    stkPush?: boolean;
  }) {
    const stkPush = params.stkPush ?? params.currency === "KES";
    const keys = await this.getKeys();
    if (!keys) throw new Error("PayzaAPI is not configured");
    const response = await fetch(`${PAYZA_BASE_URL}/api/v1/pay`, {
      method: "POST",
      headers: this.headers(keys),
      body: JSON.stringify({
        amount: params.amount,
        currency: getPayzaApiCurrencyCode(params.currency) || params.currency,
        reference: params.reference,
        stk_push: stkPush,
        customer: {
          email: params.email,
          name: params.name,
          ...(params.phone ? { phone: params.phone } : {}),
        },
        callback_url: params.callbackUrl,
        redirect_url: params.redirectUrl,
        cancel_url: params.cancelUrl,
        description: params.description,
        metadata: params.metadata,
      }),
    });
    const body = await response.json() as any;
    if (!response.ok || body.success === false) {
      throw new Error(body.message || body.error || `PayzaAPI request failed (${response.status})`);
    }
    const data = body.data || body;
    const rawPaymentUrl = String(data.payment_url || "");
    let paymentUrl: string | null = null;
    if (rawPaymentUrl) {
      try {
        const parsedPaymentUrl = new URL(rawPaymentUrl);
        if (parsedPaymentUrl.protocol !== "https:" || parsedPaymentUrl.username || parsedPaymentUrl.password) {
          throw new Error("Unexpected checkout URL");
        }
        paymentUrl = parsedPaymentUrl.toString();
      } catch {
        throw new Error("PayzaAPI returned an invalid hosted checkout URL");
      }
    }
    if (!stkPush && !paymentUrl) {
      throw new Error("PayzaAPI did not return a hosted checkout URL");
    }
    return {
      reference: String(data.reference || params.reference),
      status: String(data.status || "pending"),
      paymentUrl,
      gateway: data.gateway || "payzaapi",
      actualGateway: data.actual_gateway || null,
      amount: Number(data.amount || params.amount),
      currency: String(data.currency || getPayzaApiCurrencyCode(params.currency) || params.currency).toUpperCase(),
    };
  }

  async verifyPayment(reference: string) {
    const keys = await this.getKeys();
    if (!keys) throw new Error("PayzaAPI is not configured");
    const response = await fetch(`${PAYZA_BASE_URL}/api/v1/verify/${encodeURIComponent(reference)}`, {
      headers: this.headers(keys),
    });
    const body = await response.json() as any;
    if (!response.ok || body.success === false) {
      throw new Error(body.message || body.error || `PayzaAPI verification failed (${response.status})`);
    }
    const data = body.data || body;
    const rawStatus = String(data.status || "pending").toLowerCase();
    return {
      reference: String(data.reference || reference),
      status: ["success", "completed", "paid"].includes(rawStatus)
        ? "completed"
        : ["failed", "cancelled", "canceled", "rejected"].includes(rawStatus)
          ? "failed"
          : "pending",
      amount: Number(data.amount || 0),
      currency: String(data.currency || "").toUpperCase() === "SLL"
        ? "SLE"
        : String(data.currency || "").toUpperCase(),
      gateway: data.gateway || "payzaapi",
      actualGateway: data.actual_gateway || null,
    };
  }

  async isConfigured() {
    return Boolean(
      (await this.getKeys()) &&
      String(process.env.PAYZA_WEBHOOK_SECRET || "").trim(),
    );
  }
}

export const payzaApiService = new PayzaApiService();