import fetch from 'node-fetch';

const NEXUSPAY_BASE_URL = 'https://app.makamescopay.com/api';

export interface NexusCurrency {
  code: string;
  name: string;
  flag: string;
  gateway: string;
  channel: 'mobile_money' | 'card' | 'other';
  correspondents?: Array<{ id: string; label: string }>;
  countryCode: string;
  countryName: string;
  color: string;
}

export const NEXUSPAY_CURRENCIES: NexusCurrency[] = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', gateway: 'paystack', channel: 'card', countryCode: 'US', countryName: 'United States', color: 'from-emerald-500 to-green-600' },
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪', gateway: 'mpesa', channel: 'mobile_money', correspondents: [{ id: 'MPESA_KEN', label: 'M-Pesa' }], countryCode: 'KE', countryName: 'Kenya', color: 'from-red-500 to-orange-500' },
  { code: 'UGX', name: 'Ugandan Shilling', flag: '🇺🇬', gateway: 'pawapay', channel: 'mobile_money', correspondents: [{ id: 'MTN_MOMO_UGA', label: 'MTN Mobile Money' }, { id: 'AIRTEL_OAPI_UGA', label: 'Airtel Money' }], countryCode: 'UG', countryName: 'Uganda', color: 'from-yellow-500 to-orange-500' },
  { code: 'GHS', name: 'Ghanaian Cedi', flag: '🇬🇭', gateway: 'paystack', channel: 'mobile_money', correspondents: [{ id: 'MTN_MOMO_GHA', label: 'MTN MoMo' }, { id: 'VODAFONE_GHA', label: 'Vodafone Cash' }, { id: 'AIRTEL_TIGO_GHA', label: 'AirtelTigo' }], countryCode: 'GH', countryName: 'Ghana', color: 'from-red-600 to-green-600' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬', gateway: 'paystack', channel: 'card', countryCode: 'NG', countryName: 'Nigeria', color: 'from-green-600 to-green-800' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦', gateway: 'paystack', channel: 'card', countryCode: 'ZA', countryName: 'South Africa', color: 'from-blue-600 to-yellow-500' },
  { code: 'TZS', name: 'Tanzanian Shilling', flag: '🇹🇿', gateway: 'optimapay', channel: 'other', countryCode: 'TZ', countryName: 'Tanzania', color: 'from-cyan-500 to-blue-600' },
  { code: 'XOF', name: 'West African CFA', flag: '🌍', gateway: 'pawapay', channel: 'mobile_money', countryCode: 'SN', countryName: 'West Africa', color: 'from-purple-500 to-violet-600' },
  { code: 'CDF', name: 'Congolese Franc', flag: '🇨🇩', gateway: 'pawapay', channel: 'mobile_money', correspondents: [{ id: 'MPESA_COD', label: 'M-Pesa Congo' }, { id: 'AIRTEL_OAPI_COD', label: 'Airtel Money' }], countryCode: 'CD', countryName: 'DR Congo', color: 'from-sky-500 to-blue-600' },
  { code: 'XAF', name: 'Central African CFA', flag: '🌍', gateway: 'pawapay', channel: 'mobile_money', countryCode: 'CM', countryName: 'Central Africa', color: 'from-teal-500 to-green-600' },
  { code: 'RWF', name: 'Rwandan Franc', flag: '🇷🇼', gateway: 'pawapay', channel: 'mobile_money', correspondents: [{ id: 'MTN_MOMO_RWA', label: 'MTN MoMo' }, { id: 'AIRTEL_OAPI_RWA', label: 'Airtel Money' }], countryCode: 'RW', countryName: 'Rwanda', color: 'from-blue-600 to-cyan-500' },
  { code: 'SLE', name: 'Sierra Leonean Leone', flag: '🇸🇱', gateway: 'pawapay', channel: 'mobile_money', correspondents: [{ id: 'ORANGE_SLE', label: 'Orange Money' }], countryCode: 'SL', countryName: 'Sierra Leone', color: 'from-green-500 to-teal-600' },
  { code: 'ZMW', name: 'Zambian Kwacha', flag: '🇿🇲', gateway: 'pawapay', channel: 'mobile_money', correspondents: [{ id: 'MTN_MOMO_ZMB', label: 'MTN MoMo' }, { id: 'AIRTEL_OAPI_ZMB', label: 'Airtel Money' }], countryCode: 'ZM', countryName: 'Zambia', color: 'from-orange-400 to-red-500' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', gateway: 'paystack', channel: 'card', countryCode: 'EU', countryName: 'Europe', color: 'from-blue-700 to-indigo-600' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', gateway: 'paystack', channel: 'card', countryCode: 'GB', countryName: 'United Kingdom', color: 'from-indigo-700 to-purple-700' },
];

export const CURRENCY_MAP: Record<string, NexusCurrency> = Object.fromEntries(
  NEXUSPAY_CURRENCIES.map(c => [c.code, c])
);

export class NexusPayService {
  private envApiKey: string | null;
  private baseUrl: string;

  constructor() {
    this.envApiKey = process.env.NEXUSPAY_API_KEY || null;
    this.baseUrl = NEXUSPAY_BASE_URL;
  }

  async getApiKey(): Promise<string | null> {
    if (this.envApiKey) return this.envApiKey;
    try {
      const { pool } = await import('../db');
      if (pool) {
        const result = await pool.query(
          `SELECT value FROM system_settings WHERE key = $1 AND category = $2 LIMIT 1`,
          ['nexuspay_api_key', 'payment']
        );
        if (result.rows.length > 0 && result.rows[0].value) return result.rows[0].value;
      }
    } catch {}
    return null;
  }

  private headers(apiKey: string) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
  }

  async checkout(params: {
    amount: number;
    currency: string;
    channel: 'mobile_money' | 'card' | 'other';
    phone?: string;
    email?: string;
    correspondent?: string;
    description?: string;
  }): Promise<{ reference: string; status: string; redirectUrl: string | null }> {
    const apiKey = await this.getApiKey();
    if (!apiKey) throw new Error('NexusPay API key not configured. Set NEXUSPAY_API_KEY or configure it in admin settings.');

    const body: Record<string, any> = {
      amount: params.amount,
      currency: params.currency,
      channel: params.channel,
      description: params.description || 'Geepay wallet deposit',
    };

    if (params.phone) body.phone = params.phone;
    if (params.email) body.email = params.email;
    if (params.correspondent) body.correspondent = params.correspondent;

    const response = await fetch(`${this.baseUrl}/checkout`, {
      method: 'POST',
      headers: this.headers(apiKey),
      body: JSON.stringify(body),
    });

    const data = await response.json() as any;
    if (!response.ok) throw new Error(data.error || `NexusPay checkout failed: ${response.status}`);
    return data;
  }

  async getStatus(reference: string): Promise<{
    id: number;
    reference: string;
    gateway: string;
    status: 'pending' | 'completed' | 'failed';
    amount: string;
    currency: string;
    completedAt?: string;
  }> {
    const apiKey = await this.getApiKey();
    if (!apiKey) throw new Error('NexusPay API key not configured');

    const response = await fetch(`${this.baseUrl}/status/${reference}`, {
      headers: this.headers(apiKey),
    });

    const data = await response.json() as any;
    if (!response.ok) throw new Error(data.error || `Status check failed: ${response.status}`);
    return data;
  }

  async getCountries(): Promise<any[]> {
    const apiKey = await this.getApiKey();
    if (apiKey) {
      try {
        const response = await fetch(`${this.baseUrl}/countries`, {
          headers: this.headers(apiKey),
        });
        if (response.ok) {
          const data = await response.json() as any;
          return data.countries || [];
        }
      } catch {}
    }
    return NEXUSPAY_CURRENCIES.map(c => ({
      code: c.countryCode,
      name: c.countryName,
      flag: c.flag,
      currency: c.code,
      gateway: c.gateway,
      correspondents: c.correspondents || [],
    }));
  }

  isConfigured(): boolean {
    return !!this.envApiKey;
  }

  getSupportedCurrencies(): NexusCurrency[] {
    return NEXUSPAY_CURRENCIES;
  }
}

export const nexusPayService = new NexusPayService();
