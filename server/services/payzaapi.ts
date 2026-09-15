import fetch from "node-fetch";

const PAYZA_BASE_URL = "https://payzaapi.co.ke";

type PayzaKeys = { publicKey: string; secretKey: string };

function cleanSetting(value: unknown): string {
  if (value && typeof value === "object") {
    return String((value as any).value ?? "");
  }
  return String(value ?? "").replace(/^"|"$/g, "").trim();
}

export class PayzaApiService {
  private async getKeys(): Promise<PayzaKeys | null> {
    const fromEnv = {
      publicKey: String(process.env.PAYZA_PUBLIC_KEY || "").trim(),
      secretKey: String(process.env.PAYZA_SECRET_KEY || "").trim(),
    };
    if (fromEnv.publicKey && fromEnv.secretKey) return fromEnv;

    try {
      const { pool } = await import("../db");
      const result = await pool.query(
        `SELECT key, value FROM system_settings
         WHERE category = 'payzaapi' AND key IN ('public_key', 'secret_key')`,
      );
      const values: Record<string, string> = {};
      for (const row of result.rows) values[row.key] = cleanSetting(row.value);
      const keys = {
        publicKey: values.public_key || fromEnv.publicKey,
        secretKey: values.secret_key || fromEnv.secretKey,
      };
      return keys.publicKey && keys.secretKey ? keys : null;
    } catch {
      return null;
    }
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
        currency: params.currency,
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
      currency: String(data.currency || params.currency).toUpperCase(),
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
      currency: String(data.currency || "").toUpperCase(),
      gateway: data.gateway || "payzaapi",
      actualGateway: data.actual_gateway || null,
    };
  }

  async isConfigured() {
    return Boolean(await this.getKeys());
  }
}

export const payzaApiService = new PayzaApiService();