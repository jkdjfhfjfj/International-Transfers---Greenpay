import fetch from "node-fetch";

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

export function getPayzaApiCurrencyCode(currency: string): string | undefined {
  return PAYZA_API_CURRENCIES.find(item => item.code === currency.toUpperCase())?.providerCode;
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
    const keys = await this.getKeys();
    if (!keys) throw new Error("PayzaAPI is not configured");
    const response = await fetch(`${PAYZA_BASE_URL}/api/v1/pay`, {
      method: "POST",
      headers: this.headers(keys),
      body: JSON.stringify({
        amount: params.amount,
        currency: getPayzaApiCurrencyCode(params.currency) || params.currency,
        reference: params.reference,
        stk_push: params.stkPush ?? params.currency === "KES",
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
    return {
      reference: String(data.reference || params.reference),
      status: String(data.status || "pending"),
      paymentUrl: data.payment_url || null,
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
      status: rawStatus === "success" ? "completed" : rawStatus === "failed" || rawStatus === "cancelled" ? "failed" : "pending",
      amount: Number(data.amount || 0),
      currency: String(data.currency || "").toUpperCase() === "SLL"
        ? "SLE"
        : String(data.currency || "").toUpperCase(),
      gateway: data.gateway || "payzaapi",
      actualGateway: data.actual_gateway || null,
    };
  }

  async isConfigured() {
    return Boolean(await this.getKeys());
  }
}

export const payzaApiService = new PayzaApiService();