import fetch from 'node-fetch';
import { getPaymentCredential } from './payment-credentials';
import { storage } from '../storage';

const PAYSTACK_KEY_STATUS_CATEGORY = "payment_health";
const PAYSTACK_KEY_REJECTED_AT = "paystack_key_rejected_at";

export interface PaystackResponse {
  status: boolean;
  message: string;
  data?: any;
}

export class PaystackService {
  private baseUrl = 'https://api.paystack.co';

  private async recordKeyRejection(rejected: boolean): Promise<void> {
    try {
      await storage.setSystemSetting({
        category: PAYSTACK_KEY_STATUS_CATEGORY,
        key: PAYSTACK_KEY_REJECTED_AT,
        value: rejected ? new Date().toISOString() : "",
        description: "Latest Paystack invalid-key status; no credential values stored",
      });
    } catch {
      console.error("[Paystack] Could not save the provider key status.");
    }
  }

  private async getSecretKeyCandidates(currency?: string): Promise<string[]> {
    const [kesKey, generalKey] = await Promise.all([
      getPaymentCredential("PAYSTACK_SECRET_KEY_KES"),
      getPaymentCredential("PAYSTACK_SECRET_KEY"),
    ]);
    const candidates = currency === "KES" ? [kesKey, generalKey] : [generalKey, kesKey];
    return Array.from(new Set(candidates.map(key => String(key || "").trim()).filter(Boolean)));
  }

  private async getSecretKey(): Promise<string> {
    return (await this.getSecretKeyCandidates("KES"))[0] || "";
  }

  private async readResponse(response: any): Promise<PaystackResponse> {
    let data: any;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      return {
        status: false,
        message: data?.message || `Paystack request failed (${response.status})`,
        ...(data?.data ? { data: data.data } : {}),
      };
    }
    if (!data || typeof data.status !== "boolean") {
      return { status: false, message: "Paystack returned an invalid response" };
    }
    return data as PaystackResponse;
  }

  async isConfigured(): Promise<boolean> {
    try {
      return (await this.getSecretKeyCandidates()).length > 0;
    } catch {
      return false;
    }
  }

  async initializePayment(
    email: string,
    amount: number,
    reference: string,
    currency: string = "KES",
    phoneNumber?: string,
    callbackUrl?: string,
    metadata?: Record<string, any>,
    channels?: string[],
  ): Promise<PaystackResponse> {
    const secretKeys = await this.getSecretKeyCandidates(currency);
    if (!secretKeys.length) {
      return {
        status: false,
        message: 'Payment service is not configured.'
      };
    }
    try {
      const url = `${this.baseUrl}/transaction/initialize`;
      
      const payload: any = {
        email,
        amount: Math.round(amount * 100), // Convert to kobo for USD or cents for KES
        reference,
        currency,
        channels: channels?.length
          ? channels
          : ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
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

      let lastResult: PaystackResponse = { status: false, message: "Payment initialization failed" };
      for (const secretKey of secretKeys) {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        lastResult = await this.readResponse(response);
        if (lastResult.status) {
          await this.recordKeyRejection(false);
          return lastResult;
        }
        if (!/invalid\s+(?:api\s+)?key/i.test(lastResult.message)) return lastResult;
      }
      if (/invalid\s+(?:api\s+)?key/i.test(lastResult.message)) await this.recordKeyRejection(true);
      return lastResult;
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
      const url = `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      });

      return await this.readResponse(response);
    } catch (error) {
      console.error('Paystack verification error:', error);
      return {
        status: false,
        message: 'Payment verification failed'
      };
    }
  }

  async createCustomer(email: string, firstName: string, lastName: string, phone?: string): Promise<PaystackResponse> {
    const secretKey = await this.getSecretKey();
    if (!secretKey) return { status: false, message: "Paystack is not configured" };
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
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      return await this.readResponse(response);
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