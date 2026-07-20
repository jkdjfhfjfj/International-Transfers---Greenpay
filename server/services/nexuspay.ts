const NEXUSPAY_BASE = "https://app.makamescopay.com/api";

function getApiKey(): string | undefined {
  return process.env.NEXUSPAY_API_KEY;
}

async function nexusFetch(path: string, options: RequestInit = {}): Promise<any> {
  const key = getApiKey();
  if (!key) throw new Error("NexusPay API key not configured (NEXUSPAY_API_KEY)");

  const res = await fetch(`${NEXUSPAY_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as any).error || `NexusPay error ${res.status}`);
  }
  return body;
}

export interface NexusCountry {
  code: string;
  name: string;
  flag: string;
  currency: string;
  gateway: string;
  correspondents: { id: string; label: string }[];
}

export interface NexusCheckoutPayload {
  amount: number;
  currency: string;
  channel: "mobile_money" | "card" | "other";
  phone?: string;
  correspondent?: string;
  email?: string;
  description?: string;
}

export interface NexusCheckoutResult {
  reference: string;
  status: string;
  redirectUrl: string | null;
}

export interface NexusStatusResult {
  id: number;
  reference: string;
  gateway: string;
  status: string;
  amount: string;
  currency: string;
  completedAt?: string;
}

export const nexuspayService = {
  isConfigured(): boolean {
    return !!getApiKey();
  },

  async getCountries(): Promise<NexusCountry[]> {
    try {
      const data = await nexusFetch("/countries");
      return (data.countries || []) as NexusCountry[];
    } catch (err: any) {
      console.error("[NexusPay] getCountries failed:", err.message);
      return [];
    }
  },

  async checkout(payload: NexusCheckoutPayload): Promise<NexusCheckoutResult> {
    return nexusFetch("/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getStatus(reference: string): Promise<NexusStatusResult> {
    return nexusFetch(`/status/${reference}`);
  },
};
