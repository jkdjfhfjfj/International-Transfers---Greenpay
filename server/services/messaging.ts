import fetch from 'node-fetch';
import { storage } from '../storage';
import { emailService } from './email';
import { whatsappService } from './whatsapp';

interface CommsGridResponse {
  status: string;
  message: string;
  data?: {
    sent: number;
    failed: number;
    total: number;
    cost: number;
    environment: string;
    details?: Array<{
      to: string;
      status: string;
      reason: string;
      message_id: string;
    }>;
  };
}

interface MessagingCredentials {
  apiKey: string;
  senderId: string;
  deviceId?: string;
}

export class MessagingService {
  private readonly SMS_URL = 'https://sms.paygrid.co.ke/api/sms/send';
  private readonly MESSAGE_PREFIX = '[GREENPAY] ';

  /**
   * Get messaging credentials from system settings (CommsGrid)
   */
  private async getCredentials(): Promise<MessagingCredentials | null> {
    try {
      const settings = await storage.getSystemSettingsByCategory('messaging');

      let apiKey = settings.find((s: any) => s.key === 'commsGrid_api_key')?.value as string;
      let senderId = settings.find((s: any) => s.key === 'commsGrid_sender_id')?.value as string;
      let deviceId = settings.find((s: any) => s.key === 'commsGrid_device_id')?.value as string | undefined;

      // Fallback to environment variables
      apiKey = apiKey || process.env.COMMSGRID_API_KEY || process.env.SMS_API_KEY || '';
      senderId = senderId || process.env.COMMSGRID_SENDER_ID || process.env.SMS_SENDER_ID || 'GREENPAY';
      deviceId = deviceId || process.env.COMMSGRID_DEVICE_ID || undefined;

      if (!apiKey || !senderId) {
        console.warn('[SMS] CommsGrid credentials not fully configured');
        return null;
      }

      return { apiKey, senderId, deviceId };
    } catch (error) {
      console.error('[SMS] Error fetching credentials:', error);
      return null;
    }
  }

  /**
   * Format phone number to international format (254XXXXXXXXX)
   */
  formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[\s\-()]/g, '');

    if (cleaned.startsWith('00')) cleaned = cleaned.substring(2);
    if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);

    if (cleaned.startsWith('254')) return cleaned;
    if (cleaned.startsWith('0')) return '254' + cleaned.substring(1);
    if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
      return '254' + cleaned;
    }

    return cleaned.startsWith('254') ? cleaned : '254' + cleaned;
  }

  /**
   * Prepend [GREENPAY] prefix and trim if needed
   */
  private formatMessage(message: string): string {
    return this.MESSAGE_PREFIX + message;
  }

  /**
   * Core SMS send via CommsGrid API
   */
  private async sendSMS(phone: string, message: string, credentials: MessagingCredentials): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const formattedMessage = this.formatMessage(message);

      const body: any = {
        recipient: [formattedPhone],
        message: formattedMessage,
        sender_id: credentials.senderId,
      };

      if (credentials.deviceId) {
        body.device_id = credentials.deviceId;
      }

      const response = await fetch(this.SMS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json() as CommsGridResponse;

      if (result.status === 'success') {
        console.log(`[SMS] Sent to ${formattedPhone} — cost: ${result.data?.cost ?? 'N/A'}`);
        return true;
      } else {
        console.error(`[SMS] Send failed: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error('[SMS] Sending error:', error);
      return false;
    }
  }

  /**
   * Send SMS to multiple recipients (admin broadcast)
   */
  async sendSMSToMultiple(phones: string[], message: string): Promise<{ sent: number; failed: number }> {
    const credentials = await this.getCredentials();
    if (!credentials) {
      console.warn('[SMS] No credentials configured for bulk send');
      return { sent: 0, failed: phones.length };
    }

    let sent = 0;
    let failed = 0;

    await Promise.all(
      phones.map(async (phone) => {
        const ok = await this.sendSMS(phone, message, credentials);
        if (ok) sent++; else failed++;
      })
    );

    return { sent, failed };
  }

  /**
   * Send WhatsApp message via Meta WhatsApp Business API
   */
  private async sendWhatsApp(phone: string, message: string): Promise<boolean> {
    try {
      if (!whatsappService.isConfigured()) return false;
      const formattedMessage = this.formatMessage(message);
      return await whatsappService.sendTextMessage(phone, formattedMessage);
    } catch (error) {
      console.error('[WhatsApp] Sending error:', error);
      return false;
    }
  }

  /**
   * Send SMS notification to admins for new live chat request
   */
  async sendAdminChatNotification(userId: string): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      const userName = (user as any)?.fullName || 'A user';
      const adminPhones = ['+254741855218', '+254794967351'];
      const credentials = await this.getCredentials();

      if (!credentials) return;

      const notification = `${userName} has started a new live chat. Please attend to them.`;
      await Promise.all(adminPhones.map(phone =>
        this.sendSMS(phone, notification, credentials).catch(err =>
          console.error(`[SMS] Failed to send admin SMS to ${phone}:`, err)
        )
      ));
    } catch (error) {
      console.error('[SMS] Error sending admin chat notification:', error);
    }
  }

  /**
   * Send message via SMS + WhatsApp concurrently
   */
  async sendMessage(phone: string, message: string): Promise<{ sms: boolean; whatsapp: boolean }> {
    const credentials = await this.getCredentials();

    const [smsResult, whatsappResult] = await Promise.all([
      credentials ? this.sendSMS(phone, message, credentials) : Promise.resolve(false),
      this.sendWhatsApp(phone, message),
    ]);

    if (!credentials) console.warn('[SMS] Skipped: credentials not configured');

    return { sms: smsResult, whatsapp: whatsappResult };
  }

  /**
   * Send OTP via SMS + WhatsApp + Email (concurrent)
   */
  async sendOTP(
    phone: string,
    otpCode: string,
    email?: string,
    userName?: string
  ): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    console.log(`[OTP] Sending to phone: ${phone}`);

    const enableSetting = await storage.getSystemSetting('messaging', 'enable_otp_messages');
    if (enableSetting?.value === 'false') {
      console.log('[OTP] Disabled by setting');
      return { sms: false, whatsapp: false, email: false };
    }

    const { mailtrapService } = await import('./mailtrap');
    const credentials = await this.getCredentials();
    const firstName = userName?.split(' ')[0] || 'User';
    const lastName = userName?.split(' ').slice(1).join(' ') || '';

    const [smsResult, whatsappResult, emailResult] = await Promise.all([
      credentials
        ? this.sendSMS(phone, `Your GreenPay verification code is ${otpCode}. Valid for 10 minutes. Do not share with anyone.`, credentials)
        : Promise.resolve(false),
      whatsappService.isConfigured() ? whatsappService.sendOTP(phone, otpCode) : Promise.resolve(false),
      email ? mailtrapService.sendOTP(email, firstName, lastName, otpCode) : Promise.resolve(false),
    ]);

    console.log(`[OTP] Results — SMS: ${smsResult}, WA: ${whatsappResult}, Email: ${emailResult}`);
    return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
  }

  /**
   * Send login alert via SMS + WhatsApp + Email
   */
  async sendLoginAlert(
    phone: string,
    location: string,
    ip: string,
    email?: string,
    userName?: string
  ): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const enableSetting = await storage.getSystemSetting('messaging', 'enable_login_alert_messages');
    if (enableSetting?.value === 'false') return { sms: false, whatsapp: false, email: false };

    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
    const credentials = await this.getCredentials();

    const [smsResult, whatsappResult, emailResult] = await Promise.all([
      credentials
        ? this.sendSMS(phone, `New login to your GreenPay account from ${location} (IP: ${ip}). Not you? Contact support immediately.`, credentials)
        : Promise.resolve(false),
      whatsappService.isConfigured() ? whatsappService.sendLoginAlert(phone, location, ip) : Promise.resolve(false),
      email ? emailService.sendLoginAlert(email, location, ip, timestamp, userName) : Promise.resolve(false),
    ]);

    return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
  }

  /**
   * Send password reset via SMS + WhatsApp + Email
   */
  async sendPasswordReset(
    phone: string,
    resetCode: string,
    email?: string,
    userName?: string
  ): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const enableSetting = await storage.getSystemSetting('messaging', 'enable_password_reset_messages');
    if (enableSetting?.value === 'false') return { sms: false, whatsapp: false, email: false };

    const { mailtrapService } = await import('./mailtrap');
    const credentials = await this.getCredentials();
    const firstName = userName?.split(' ')[0] || 'User';
    const lastName = userName?.split(' ').slice(1).join(' ') || '';

    const [smsResult, whatsappResult, emailResult] = await Promise.all([
      credentials
        ? this.sendSMS(phone, `Your GreenPay password reset code is ${resetCode}. Valid for 10 minutes.`, credentials)
        : Promise.resolve(false),
      whatsappService.isConfigured() ? whatsappService.sendPasswordReset(phone, resetCode) : Promise.resolve(false),
      email ? mailtrapService.sendPasswordReset(email, firstName, lastName, resetCode) : Promise.resolve(false),
    ]);

    return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
  }

  /**
   * Send fund receipt via SMS + WhatsApp + Email
   */
  async sendFundReceipt(
    phone: string,
    amount: string,
    currency: string,
    sender: string,
    email?: string,
    userName?: string
  ): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const enableSetting = await storage.getSystemSetting('messaging', 'enable_fund_receipt_messages');
    if (enableSetting?.value === 'false') return { sms: false, whatsapp: false, email: false };

    const credentials = await this.getCredentials();

    const [smsResult, whatsappResult, emailResult] = await Promise.all([
      credentials
        ? this.sendSMS(phone, `You received ${currency} ${amount} from ${sender}. Your GreenPay balance has been updated.`, credentials)
        : Promise.resolve(false),
      whatsappService.isConfigured() ? whatsappService.sendFundReceipt(phone, amount, currency, sender) : Promise.resolve(false),
      email ? emailService.sendFundReceipt(email, amount, currency, sender, userName) : Promise.resolve(false),
    ]);

    return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
  }

  /**
   * Send deposit confirmation via SMS
   */
  async sendDepositConfirmation(
    phone: string,
    amount: string,
    currency: string,
    method: string,
    email?: string,
    userName?: string
  ): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const enableSetting = await storage.getSystemSetting('messaging', 'enable_deposit_messages');
    if (enableSetting?.value === 'false') return { sms: false, whatsapp: false, email: false };

    const credentials = await this.getCredentials();

    const [smsResult, whatsappResult] = await Promise.all([
      credentials
        ? this.sendSMS(phone, `Deposit of ${currency} ${amount} via ${method} was successful. Your GreenPay account has been credited.`, credentials)
        : Promise.resolve(false),
      whatsappService.isConfigured()
        ? whatsappService.sendTextMessage(phone, this.formatMessage(`Deposit of ${currency} ${amount} via ${method} successful. Account credited.`))
        : Promise.resolve(false),
    ]);

    return { sms: smsResult, whatsapp: whatsappResult, email: false };
  }

  /**
   * Send withdrawal notification via SMS + WhatsApp + Email
   */
  async sendWithdrawalNotification(
    phone: string,
    amount: string,
    currency: string,
    destination: string,
    status: string,
    email?: string,
    userName?: string
  ): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const enableSetting = await storage.getSystemSetting('messaging', 'enable_withdrawal_messages');
    if (enableSetting?.value === 'false') return { sms: false, whatsapp: false, email: false };

    const credentials = await this.getCredentials();

    const [smsResult, whatsappResult] = await Promise.all([
      credentials
        ? this.sendSMS(phone, `Withdrawal of ${currency} ${amount} to ${destination} is ${status}. Check your GreenPay account for details.`, credentials)
        : Promise.resolve(false),
      whatsappService.isConfigured()
        ? whatsappService.sendTextMessage(phone, this.formatMessage(`Withdrawal of ${currency} ${amount} is ${status}.`))
        : Promise.resolve(false),
    ]);

    return { sms: smsResult, whatsapp: whatsappResult, email: false };
  }

  /**
   * Send card issued/activated notification
   */
  async sendCardActivation(
    phone: string,
    cardLastFour: string,
    email?: string,
    userName?: string
  ): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const enableSetting = await storage.getSystemSetting('messaging', 'enable_card_activation_messages');
    if (enableSetting?.value === 'false') return { sms: false, whatsapp: false, email: false };

    const credentials = await this.getCredentials();

    const [smsResult, whatsappResult, emailResult] = await Promise.all([
      credentials
        ? this.sendSMS(phone, `Your GreenPay virtual card ending in ${cardLastFour} has been issued and is now active. Use it for online payments worldwide.`, credentials)
        : Promise.resolve(false),
      whatsappService.isConfigured() ? whatsappService.sendCardActivation(phone, cardLastFour) : Promise.resolve(false),
      email ? emailService.sendCardActivation(email, cardLastFour, userName) : Promise.resolve(false),
    ]);

    return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
  }

  /**
   * Send KYC verified notification
   */
  async sendKYCVerified(
    phone: string,
    email?: string,
    userName?: string
  ): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const enableSetting = await storage.getSystemSetting('messaging', 'enable_kyc_verified_messages');
    if (enableSetting?.value === 'false') return { sms: false, whatsapp: false, email: false };

    const credentials = await this.getCredentials();

    const [smsResult, whatsappResult, emailResult] = await Promise.all([
      credentials
        ? this.sendSMS(phone, `Your GreenPay account is now verified! You have full access to all platform features.`, credentials)
        : Promise.resolve(false),
      whatsappService.isConfigured() ? whatsappService.sendKYCVerified(phone) : Promise.resolve(false),
      email && userName ? emailService.sendKYCVerified(email, userName) : Promise.resolve(false),
    ]);

    return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
  }

  /**
   * Send transaction notification (send/receive/general)
   */
  async sendTransactionNotification(
    phone: string,
    type: string,
    amount: string,
    currency: string,
    status: string,
    transactionId?: string,
    email?: string,
    userName?: string
  ): Promise<{ sms: boolean; whatsapp: boolean; email: boolean }> {
    const action = type === 'withdraw' ? 'Withdrawal' : type === 'send' ? 'Transfer sent' : type === 'receive' ? 'Transfer received' : 'Transaction';
    const message = `${action} of ${currency} ${amount} — Status: ${status}. Ref: ${transactionId || 'N/A'}`;

    const credentials = await this.getCredentials();

    const [smsResult, whatsappResult, emailResult] = await Promise.all([
      credentials ? this.sendSMS(phone, message, credentials) : Promise.resolve(false),
      whatsappService.isConfigured()
        ? whatsappService.sendTextMessage(phone, this.formatMessage(message))
        : Promise.resolve(false),
      email && transactionId
        ? emailService.sendTransactionNotification(email, type, amount, currency, status, transactionId, userName)
        : Promise.resolve(false),
    ]);

    return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
  }

  /**
   * Generate 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export const messagingService = new MessagingService();
