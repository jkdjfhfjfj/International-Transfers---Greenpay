import fetch from 'node-fetch';
import { storage } from '../storage';
import { formatPayHeroAmount, formatPayHeroPhone } from './payhero-format';
import {
  getPaymentCredential,
  getPaymentCredentialStatus,
} from './payment-credentials';

export interface PayHeroResponse {
  success: boolean;
  status: string;
  reference: string;
  CheckoutRequestID: string;
  message?: string;
}

export interface PayHeroCallbackResponse {
  forward_url: string;
  response: {
    Amount: number;
    CheckoutRequestID: string;
    ExternalReference: string;
    MerchantRequestID: string;
    MpesaReceiptNumber: string;
    Phone: string;
    ResultCode: number;
    ResultDesc: string;
    Status: string;
  };
  status: boolean;
}

export class PayHeroService {
  private channelId?: number;
  private baseUrl = 'https://backend.payhero.co.ke/api/v2';

  constructor() {
    // The channel ID is non-secret and can be set in admin payment settings.
    const channelId = process.env.PAYHERO_CHANNEL_ID;
    // PayHero requires the merchant's registered channel ID. Do not guess a
    // fallback channel because that produces an opaque provider HTTP 400.
    this.channelId = channelId ? parseInt(channelId, 10) : undefined;

    this.loadCredentialsFromDatabase();
  }

  /**
   * Load the non-secret channel identifier from system settings.
   */
  private async loadCredentialsFromDatabase(): Promise<void> {
    try {
      const settings = await storage.getSystemSettingsByCategory('payhero');
      const channelId = settings.find((s: any) => s.key === 'channel_id')?.value;

      if (!process.env.PAYHERO_CHANNEL_ID && channelId) {
        const parsedChannelId = parseInt(this.parseValue(channelId), 10);
        if (Number.isFinite(parsedChannelId) && parsedChannelId > 0) this.channelId = parsedChannelId;
      }
    } catch (error) {
      console.error('Error loading PayHero channel configuration:', error);
    }
  }

  /**
   * Parse database value that might have extra quotes from JSON
   */
  private parseValue(value: any): string {
    if (!value) return '';
    
    // Convert to string if not already
    let parsed = String(value).trim();
    
    // Remove extra quotes if present (e.g., """3407""" -> 3407)
    while (parsed.startsWith('"') && parsed.endsWith('"')) {
      parsed = parsed.slice(1, -1);
    }
    return parsed;
  }

  private hasCredentials(
    credentials: { username?: string; password?: string; channelId?: number },
  ): boolean {
    return !!(credentials.username && credentials.password && credentials.channelId);
  }

  /**
   * Provider usernames and passwords use Replit Secrets first, then the
   * encrypted admin fallback.
   */
  async getCredentials(): Promise<{ username?: string; password?: string; channelId?: number }> {
    await this.loadCredentialsFromDatabase();
    const [username, password] = await Promise.all([
      getPaymentCredential("PAYHERO_USERNAME"),
      getPaymentCredential("PAYHERO_PASSWORD"),
    ]);
    return {
      username: username || undefined,
      password: password || undefined,
      channelId: this.channelId
    };
  }

  /**
   * Update PayHero's non-secret channel identifier.
   */
  updateSettings(channelId?: number): void {
    if (channelId !== undefined) this.channelId = channelId;
  }

  async getReadiness(): Promise<{
    configured: boolean;
    usernameConfigured: boolean;
    passwordConfigured: boolean;
    channelConfigured: boolean;
  }> {
    await this.loadCredentialsFromDatabase();
    const [usernameStatus, passwordStatus] = await Promise.all([
      getPaymentCredentialStatus("PAYHERO_USERNAME"),
      getPaymentCredentialStatus("PAYHERO_PASSWORD"),
    ]);
    const usernameConfigured = usernameStatus.configured;
    const passwordConfigured = passwordStatus.configured;
    const channelConfigured = Boolean(this.channelId && this.channelId > 0);
    return {
      configured: usernameConfigured && passwordConfigured && channelConfigured,
      usernameConfigured,
      passwordConfigured,
      channelConfigured,
    };
  }

  /**
   * Get current channel ID
   */
  getChannelId(): number | undefined {
    return this.channelId;
  }

  /**
   * Generate a unique reference for PayHero transactions
   */
  generateReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `GPY${timestamp.slice(-8)}${random}`;
  }

  /**
   * Initiate M-Pesa STK Push payment
   */
  async initiateMpesaPayment(
    amount: number,
    phoneNumber: string,
    externalReference: string,
    customerName?: string,
    callbackUrl?: string
  ): Promise<PayHeroResponse> {
    try {
      const credentials = await this.getCredentials();
      
      if (!this.hasCredentials(credentials)) {
        console.error('PayHero credentials not available');
        return {
          success: false,
          status: 'CREDENTIALS_MISSING',
          reference: '',
          CheckoutRequestID: ''
        };
      }

      const url = `${this.baseUrl}/payments`;
      
      // PayHero requires a Kenyan local phone number in the 10-digit
      // 07xxxxxxxx/01xxxxxxxx format, even when the user entered +254...
      const cleanPhone = formatPayHeroPhone(phoneNumber);
      if (!cleanPhone) {
        console.error('PayHero phone validation failed:', {
          original: phoneNumber,
          expected: '10 digits starting with 07 or 01',
        });
        return {
          success: false,
          status: 'INVALID_PHONE_NUMBER',
          reference: '',
          CheckoutRequestID: ''
        };
      }

      const integerAmount = formatPayHeroAmount(amount);
      if (integerAmount === null) {
        return {
          success: false,
          status: 'INVALID_AMOUNT',
          reference: '',
          CheckoutRequestID: '',
          message: 'PayHero requires a positive whole-number amount.',
        };
      }

      const payload = {
        amount: integerAmount,
        phone_number: cleanPhone,
        channel_id: Number(this.channelId),
        provider: 'm-pesa',
        external_reference: externalReference,
        ...(customerName ? { customer_name: customerName } : {}),
        ...(callbackUrl ? { callback_url: callbackUrl } : {}),
      };

      // Create proper Basic Auth header
      const authorization = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
      const authHeader = `Basic ${authorization}`;

      console.log('PayHero payment request:', { 
        amount: payload.amount, 
        phone: payload.phone_number, 
        reference: externalReference,
        channel_id: payload.channel_id,
        url: url
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

      let response: any;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Safely parse response — PayHero can return empty body on auth/network errors
      const rawText = await response.text();
      let data: any = {};
      if (rawText.trim()) {
        try {
          data = JSON.parse(rawText);
        } catch (parseErr) {
          console.error('PayHero response is not valid JSON:', rawText.slice(0, 200));
        }
      } else {
        console.warn('PayHero returned an empty response body (HTTP', response.status, ')');
      }

      console.log('PayHero HTTP response:', { 
        httpStatus: response.status, 
        success: data.success, 
        status: data.status, 
        reference: data.reference,
        error: data.error || data.message 
      });
      
      // Check for HTTP errors first
      if (!response.ok) {
        const providerMessage = [data.message, data.error, data.detail, data.details]
          .filter(Boolean)
          .map((value: unknown) => typeof value === "string" ? value : JSON.stringify(value))
          .join("; ") || `PayHero rejected the request with HTTP ${response.status}`;
        console.error('PayHero HTTP error:', response.status, providerMessage);
        return {
          success: false,
          status: `HTTP_${response.status}`,
          reference: '',
          CheckoutRequestID: '',
          message: providerMessage,
        };
      }
      
      return {
        success: data.success || false,
        status: data.status || 'FAILED',
        reference: data.reference || '',
        CheckoutRequestID: data.CheckoutRequestID || '',
        message: data.message,
      };
    } catch (error: any) {
      const isTimeout = error?.name === 'AbortError' || error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT';
      console.error('PayHero payment initiation error:', isTimeout ? 'Request timed out (504)' : error);
      return {
        success: false,
        status: isTimeout ? 'TIMEOUT' : 'ERROR',
        reference: '',
        CheckoutRequestID: '',
        message: isTimeout ? 'PayHero request timed out' : (error?.message || 'PayHero request failed'),
      };
    }
  }

  /**
   * Check transaction status using PayHero's transaction-status endpoint
   */
  async checkTransactionStatus(reference: string): Promise<{ success: boolean; status: string; data?: any; message?: string }> {
    try {
      const credentials = await this.getCredentials();
      if (!this.hasCredentials(credentials)) {
        return {
          success: false,
          status: "CREDENTIALS_MISSING",
          message: "PayHero credentials are not configured",
        };
      }

      const url = `${this.baseUrl}/transaction-status?reference=${reference}`;
      
      // Create proper Basic Auth header
      const authorization = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
      const authHeader = `Basic ${authorization}`;

      console.log('Checking PayHero transaction status:', { reference, url });

      const statusController = new AbortController();
      const statusTimeoutId = setTimeout(() => statusController.abort(), 15000); // 15-second timeout

      let response: any;
      try {
        response = await fetch(url, {
          method: 'GET',
          headers: { 'Authorization': authHeader },
          signal: statusController.signal
        });
      } finally {
        clearTimeout(statusTimeoutId);
      }

      // Safely parse — status endpoint can also return empty body
      const rawText = await response.text();
      let data: any = {};
      if (rawText.trim()) {
        try {
          data = JSON.parse(rawText);
        } catch (parseErr) {
          console.error('PayHero status response is not valid JSON:', rawText.slice(0, 200));
        }
      } else {
        console.warn('PayHero status check returned empty body (HTTP', response.status, ')');
      }

      console.log('PayHero transaction status response:', { 
        httpStatus: response.status,
        reference,
        status: data.status,
        success: data.success
      });
      
      if (!response.ok) {
        console.error('PayHero transaction status HTTP error:', response.status, data);
        return {
          success: false,
          status: 'ERROR',
          message: data.message || 'Failed to check transaction status'
        };
      }
      
      return {
        success: true,
        status: data.status || 'UNKNOWN',
        data: data,
        message: data.message
      };
    } catch (error: any) {
      const isTimeout = error?.name === 'AbortError' || error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT';
      console.error('PayHero status check error:', isTimeout ? 'Request timed out' : error);
      return {
        success: false,
        status: isTimeout ? 'TIMEOUT' : 'ERROR',
        message: isTimeout ? 'PayHero request timed out — please try again' : 'Failed to check transaction status'
      };
    }
  }

  /**
   * Process PayHero callback response
   */
  processCallback(callbackData: PayHeroCallbackResponse): {
    success: boolean;
    amount: number;
    reference: string;
    mpesaReceiptNumber?: string;
    status: string;
  } {
    const { response } = callbackData;
    
    return {
      success: response.ResultCode === 0 && response.Status === 'Success',
      amount: response.Amount,
      reference: response.ExternalReference,
      mpesaReceiptNumber: response.MpesaReceiptNumber,
      status: response.Status
    };
  }

  /**
   * Convert USD to KES using the configured live exchange-rate provider.
   */
  async convertUSDtoKES(usdAmount: number): Promise<number> {
    const { exchangeRateService } = await import("./exchange-rate");
    const exchangeRate = await exchangeRateService.getExchangeRate("USD", "KES");
    return Math.round(usdAmount * exchangeRate);
  }
}

// Export singleton instance
export const payHeroService = new PayHeroService();