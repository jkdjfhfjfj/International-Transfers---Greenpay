import fetch from 'node-fetch';

export interface PaystackResponse {
  status: boolean;
  message: string;
  data?: any;
}

export class PaystackService {
  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';
  private configured: boolean;

  constructor() {
    // Use KES-specific key if available, otherwise fallback to general key
    const secretKey = process.env.PAYSTACK_SECRET_KEY_KES || process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.warn('Paystack secret key not provided - payment features will be disabled');
      this.configured = false;
      this.secretKey = '';
    } else {
      this.configured = true;
      this.secretKey = secretKey;
    }
  }

  private async getSecretKey(): Promise<string> {
    if (this.secretKey) return this.secretKey;
    try {
      const { pool } = await import("../db");
      const result = await pool.query(
        `SELECT value FROM system_settings WHERE category = 'paystack' AND key = 'secret_key' LIMIT 1`,
      );
      const raw = result.rows[0]?.value as any;
      const value = typeof raw === "object" ? raw?.value : raw;
      return String(value || "").replace(/^"|"$/g, "").trim();
    } catch {
      return "";
    }
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(await this.getSecretKey());
  }

  async initializePayment(email: string, amount: number, reference: string, currency: string = 'KES', phoneNumber?: string, callbackUrl?: string, metadata?: Record<string, any>): Promise<PaystackResponse> {
    const secretKey = await this.getSecretKey();
    if (!secretKey) {
      return {
        status: false,
        message: 'Paystack is not configured. Please add PAYSTACK_SECRET_KEY to environment variables.'
      };
    }
    try {
      const url = `${this.baseUrl}/transaction/initialize`;
      
      const payload: any = {
        email,
        amount: Math.round(amount * 100), // Convert to kobo for USD or cents for KES
        reference,
        currency,
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
      };

      // Add callback URLs for success and failure tracking
      if (callbackUrl) {
        payload.callback_url = callbackUrl;
      }

      // Add M-Pesa mobile money configuration for KES
      if (currency === 'KES' && phoneNumber) {
        payload.mobile_money = {
          phone: phoneNumber,
          provider: 'mpesa'
        };
      }

      // Add custom metadata (billing address, payment method, etc.)
      if (metadata && Object.keys(metadata).length > 0) {
        payload.metadata = { custom_fields: Object.entries(metadata).map(([key, value]) => ({ display_name: key, variable_name: key, value })) };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as PaystackResponse;
      return data;
    } catch (error) {
      console.error('Paystack initialization error:', error);
      return {
        status: false,
        message: 'Payment initialization failed'
      };
    }
  }

  async verifyPayment(reference: string): Promise<PaystackResponse> {
    const secretKey = await this.getSecretKey();
    if (!secretKey) return { status: false, message: "Paystack is not configured" };
    try {
      const url = `${this.baseUrl}/transaction/verify/${reference}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      });

      const data = await response.json() as PaystackResponse;
      return data;
    } catch (error) {
      console.error('Paystack verification error:', error);
      return {
        status: false,
        message: 'Payment verification failed'
      };
    }
  }

  async createCustomer(email: string, firstName: string, lastName: string, phone?: string): Promise<PaystackResponse> {
    try {
      const url = `${this.baseUrl}/customer`;
      
      const payload = {
        email,
        first_name: firstName,
        last_name: lastName,
        phone
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as PaystackResponse;
      return data;
    } catch (error) {
      console.error('Paystack customer creation error:', error);
      return {
        status: false,
        message: 'Customer creation failed'
      };
    }
  }

  async convertUSDtoKES(usdAmount: number): Promise<number> {
    try {
      // Import exchange rate service dynamically to avoid circular imports
      const { exchangeRateService } = await import('./exchange-rate');
      const rate = await exchangeRateService.getExchangeRate('USD', 'KES');
      return usdAmount * rate;
    } catch (error) {
      console.error('Currency conversion error:', error);
      throw new Error('Currency conversion is unavailable');
    }
  }

  generateReference(): string {
    return 'GP_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

export const paystackService = new PaystackService();