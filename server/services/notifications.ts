import { storage } from "../storage";
import { fcmService } from "./fcm";

// Account notifications are persisted first so the web client can display
// them even when the user is offline. Native clients additionally receive FCM.
export interface NotificationPayload {
  title: string;
  body: string;
  userId: string;
  type: 'transaction' | 'security' | 'general';
  metadata?: Record<string, any>;
}

export class NotificationService {
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      const notification = await storage.createNotification({
        userId: payload.userId,
        title: payload.title,
        message: payload.body,
        type: payload.type === "security" ? "warning" : payload.type === "transaction" ? "success" : "info",
        isGlobal: false,
        actionUrl: payload.metadata?.actionUrl,
        metadata: payload.metadata,
      });

      const user = await storage.getUser(payload.userId);
      let delivered = true;
      if (user?.fcmToken && user.pushNotificationsEnabled !== false) {
        delivered = await fcmService.sendToToken(
          user.fcmToken,
          payload.title,
          payload.body,
          { type: payload.type, notificationId: notification.id, ...Object.fromEntries(
            Object.entries(payload.metadata || {}).map(([key, value]) => [key, String(value)]),
          ) },
        );
      }
      return delivered;
    } catch (error) {
      console.error('Notification sending error:', error);
      return false;
    }
  }

  async registerPushToken(userId: string, token: string): Promise<boolean> {
    try {
      await storage.updateUser(userId, { fcmToken: token, pushNotificationsEnabled: true });
      console.log(`Push token registered for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Push token registration error:', error);
      return false;
    }
  }

  async sendTransactionNotification(userId: string, transaction: any): Promise<void> {
    const amount = Number(transaction.amount || 0);
    const fee = Number(transaction.fee ?? transaction.metadata?.fee ?? 0);
    const outgoing = ["send", "withdraw", "card_purchase", "exchange", "transfer", "bill_payment", "airtime"].includes(String(transaction.type));
    const label = String(transaction.type) === "send" ? "send money" :
      String(transaction.type) === "receive" ? "money received" :
      String(transaction.type) === "exchange" ? "currency exchange" :
      String(transaction.type) === "transfer" ? "account transfer" :
      String(transaction.type) === "bill_payment" ? "bill payment" :
      String(transaction.type) === "airtime" ? "airtime purchase" :
      String(transaction.type) === "withdraw" ? "withdrawal" : "transaction";
    const currency = String(transaction.currency || "");
    const reference = String(transaction.reference || transaction.id || "");
    const status = String(transaction.status || "updated");
    const payload: NotificationPayload = {
      title: `${label.charAt(0).toUpperCase()}${label.slice(1)} ${status}`,
      body: `Your ${label} of ${currency} ${transaction.amount} is ${status}. Fee: ${currency} ${fee.toFixed(2)}. TID: ${reference}.`,
      userId,
      type: 'transaction',
      metadata: {
        transactionId: transaction.id,
        reference,
        fee: fee.toFixed(2),
        total: (outgoing ? amount + fee : amount - fee).toFixed(2),
        currency,
        transactionType: transaction.type,
        actionUrl: "/transactions",
      }
    };

    await this.sendNotification(payload);
    void this.sendTransactionEmail(userId, transaction);
  }

  private async sendTransactionEmail(userId: string, transaction: any): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      if (!user?.email) return;
      const { mailtrapService } = await import("./mailtrap");
      await mailtrapService.sendTransactionActivity(
        user.email,
        user.fullName?.split(" ")[0] || "User",
        user.fullName?.split(" ").slice(1).join(" ") || "",
        transaction,
      );
    } catch (error) {
      console.error("[Notification] Transaction email failed:", error);
    }
  }

  async sendSecurityNotification(userId: string, message: string, event = "Security alert", details: Record<string, string> = {}): Promise<void> {
    const payload: NotificationPayload = {
      title: event,
      body: message,
      userId,
      type: 'security',
      metadata: { actionUrl: "/settings", securityEvent: event },
    };

    await this.sendNotification(payload);
    try {
      const user = await storage.getUser(userId);
      if (!user?.email) return;
      const { mailtrapService } = await import("./mailtrap");
      await mailtrapService.sendSecurityAlert(
        user.email,
        user.fullName?.split(" ")[0] || "User",
        user.fullName?.split(" ").slice(1).join(" ") || "",
        event,
        message,
        details,
      );
    } catch (error) {
      console.error("[Notification] Security email failed:", error);
    }
  }
}

export const notificationService = new NotificationService();