import fetch from 'node-fetch';
import { storage } from '../storage';

interface MailtrapTemplate {
  uuid: string;
  variables: Record<string, string>;
}

// Default template UUIDs — overridden by admin settings in DB
const DEFAULT_TEMPLATE_UUIDs: Record<string, string> = {
  otp: '64254a5b-a2ba-4b7d-aa41-5a0907c836db',
  password_reset: '97fe2c00-4cfd-433b-b262-25632cbdbed7',
  welcome: '7711c72e-431b-4fb9-bea9-9738d4d8bfe7',
  kyc_submitted: 'dd087e67-8a7b-4bb8-9645-acbd61666d76',
  kyc_verified: 'c6353bf3-8e12-4852-8607-82223f49a4aa',
  login_alert: '42ce5e3b-eed9-41aa-808c-cfecbd906e60',
  fund_receipt: '5e2a2ec4-37fb-4178-96c4-598977065f9c',
  card_activation: 'a1b2c3d4-e5f6-4789-0123-456789abcdef',
  transaction_export: '307e5609-66bb-4235-8653-27f0d5d74a39',
  transaction_completed: '',
  virtual_account_approved: '',
};

export class MailtrapService {
  private apiKey: string | null = null;
  private apiUrl = 'https://send.api.mailtrap.io/api/send';
  private fromEmail = 'support@geepay.us';
  private fromName = 'Geepay';

  constructor() {
    // Load API key from environment only; do not fall back to a hard-coded key.
    this.apiKey = process.env.MAILTRAP_API_KEY || null;
    this.loadApiKey().catch(err => console.error('[Mailtrap] Background load error:', err));
  }

  private async loadApiKey(): Promise<void> {
    try {
      const setting = await storage.getSystemSetting('email', 'mailtrap_api_key');
      if (setting?.value) {
        this.apiKey = setting.value;
        // Keep env in sync for current process/session
        process.env.MAILTRAP_API_KEY = setting.value;
      } else {
        // If DB setting missing, rely on environment only (no hard-coded fallback)
        this.apiKey = process.env.MAILTRAP_API_KEY || null;
      }
    } catch {
      this.apiKey = process.env.MAILTRAP_API_KEY || null;
    }
  }

  async refreshApiKey(): Promise<void> {
    await this.loadApiKey();
  }

  /**
   * Get template UUID — checks DB first, falls back to hardcoded defaults
   */
  private async getTemplateUuid(templateName: string): Promise<string | null> {
    try {
      const setting = await storage.getSystemSetting('email_templates', templateName);
      if (setting?.value && setting.value.trim()) return setting.value.trim();
    } catch { /* ignore */ }
    return DEFAULT_TEMPLATE_UUIDs[templateName] || null;
  }

  /**
   * Send email using Mailtrap template
   */
  async sendTemplate(
    toEmail: string,
    templateUuid: string,
    variables: Record<string, string>,
    attachments?: Array<{ filename: string; content: string; disposition: string }>
  ): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.error('[Mailtrap] API key not configured');
        return false;
      }

      if (!templateUuid) {
        console.warn('[Mailtrap] Template UUID not configured — skipping email');
        return false;
      }

      const payload: any = {
        template_uuid: templateUuid,
        template_variables: variables,
        from: { email: this.fromEmail, name: this.fromName },
        to: [{ email: toEmail }],
      };

      if (attachments?.length) payload.attachments = attachments;

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Api-Token': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[Mailtrap] Send failed ${response.status}: ${error}`);
        return false;
      }

      const result = await response.json() as any;
      if (result.success || result.message_id || result.messages) {
        console.log(`[Mailtrap] ✓ Sent template ${templateUuid} to ${toEmail}`);
        return true;
      }
      console.warn('[Mailtrap] Unexpected response:', result);
      return true;
    } catch (error) {
      console.error('[Mailtrap] Error:', error);
      return false;
    }
  }

  async sendOTP(toEmail: string, firstName: string, lastName: string, otp: string): Promise<boolean> {
    const uuid = await this.getTemplateUuid('otp');
    if (!uuid) return false;
    return this.sendTemplate(toEmail, uuid, { first_name: firstName, last_name: lastName, otp });
  }

  async sendPasswordReset(toEmail: string, firstName: string, lastName: string, resetCode: string): Promise<boolean> {
    const uuid = await this.getTemplateUuid('password_reset');
    if (!uuid) return false;
    return this.sendTemplate(toEmail, uuid, { first_name: firstName, last_name: lastName, reset_code: resetCode });
  }

  async sendWelcome(toEmail: string, firstName: string, lastName: string): Promise<boolean> {
    const uuid = await this.getTemplateUuid('welcome');
    if (!uuid) return false;
    return this.sendTemplate(toEmail, uuid, { first_name: firstName, last_name: lastName });
  }

  async sendKYCSubmitted(toEmail: string, firstName: string, lastName: string): Promise<boolean> {
    const uuid = await this.getTemplateUuid('kyc_submitted');
    if (!uuid) return false;
    return this.sendTemplate(toEmail, uuid, { first_name: firstName, last_name: lastName });
  }

  async sendKYCVerified(toEmail: string, firstName: string, lastName: string): Promise<boolean> {
    const uuid = await this.getTemplateUuid('kyc_verified');
    if (!uuid) return false;
    return this.sendTemplate(toEmail, uuid, { first_name: firstName, last_name: lastName });
  }

  async sendLoginAlert(
    toEmail: string, firstName: string, lastName: string,
    location: string, ipAddress: string, device: string
  ): Promise<boolean> {
    const uuid = await this.getTemplateUuid('login_alert');
    if (!uuid) return false;
    return this.sendTemplate(toEmail, uuid, {
      first_name: firstName, last_name: lastName,
      location, ip_address: ipAddress, device,
    });
  }

  async sendFundReceipt(
    toEmail: string, firstName: string, lastName: string,
    amount: string, currency: string, sender: string
  ): Promise<boolean> {
    const uuid = await this.getTemplateUuid('fund_receipt');
    if (!uuid) return false;
    return this.sendTemplate(toEmail, uuid, {
      first_name: firstName, last_name: lastName,
      amount, currency, sender,
    });
  }

  async sendCardActivation(
    toEmail: string, firstName: string, lastName: string, cardLastFour: string
  ): Promise<boolean> {
    const uuid = await this.getTemplateUuid('card_activation');
    if (!uuid) return false;
    return this.sendTemplate(toEmail, uuid, {
      first_name: firstName, last_name: lastName, card_last_four: cardLastFour,
    });
  }

  async sendCustomTemplate(
    toEmail: string, templateUuid: string, variables: Record<string, string>
  ): Promise<boolean> {
    return this.sendTemplate(toEmail, templateUuid, variables);
  }

  async sendTransactionCompleted(
    toEmail: string,
    firstName: string,
    lastName: string,
    amount: string,
    currency: string,
    transactionType: string,
    transactionId: string,
    date?: string
  ): Promise<boolean> {
    const uuid = await this.getTemplateUuid('transaction_completed');
    if (!uuid) {
      console.warn('[Mailtrap] transaction_completed template UUID not configured — skipping email');
      return false;
    }
    const typeLabel =
      transactionType === 'deposit' ? 'Deposit' :
      transactionType === 'withdraw' ? 'Withdrawal' :
      transactionType === 'send' ? 'Transfer Sent' :
      transactionType === 'receive' ? 'Transfer Received' : 'Transaction';

    return this.sendTemplate(toEmail, uuid, {
      first_name: firstName,
      last_name: lastName,
      amount,
      currency,
      transaction_type: typeLabel,
      transaction_id: transactionId,
      status: 'Completed',
      date: date || new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    });
  }

  async sendVirtualAccountApproved(toEmail: string, firstName: string, lastName: string, variables: Record<string, string>): Promise<boolean> {
    const uuid = await this.getTemplateUuid('virtual_account_approved');
    if (!uuid) {
      console.warn('[Mailtrap] virtual_account_approved template UUID not configured — skipping email');
      return false;
    }
    return this.sendTemplate(toEmail, uuid, { first_name: firstName, last_name: lastName, ...variables });
  }

  async sendTransactionExport(
    toEmail: string, firstName: string, lastName: string,
    attachments: Array<{ filename: string; content: string; disposition: string }>
  ): Promise<boolean> {
    const uuid = await this.getTemplateUuid('transaction_export');
    if (!uuid) return false;
    return this.sendTemplate(toEmail, uuid, { first_name: firstName, last_name: lastName }, attachments);
  }

  /** Return all template names and their current UUIDs (DB overrides + defaults) */
  async getAllTemplateUuids(): Promise<Record<string, { uuid: string; isCustom: boolean }>> {
    const result: Record<string, { uuid: string; isCustom: boolean }> = {};
    for (const name of Object.keys(DEFAULT_TEMPLATE_UUIDs)) {
      try {
        const setting = await storage.getSystemSetting('email_templates', name);
        if (setting?.value?.trim()) {
          result[name] = { uuid: setting.value.trim(), isCustom: true };
        } else {
          result[name] = { uuid: DEFAULT_TEMPLATE_UUIDs[name], isCustom: false };
        }
      } catch {
        result[name] = { uuid: DEFAULT_TEMPLATE_UUIDs[name], isCustom: false };
      }
    }
    return result;
  }
}

export const mailtrapService = new MailtrapService();
