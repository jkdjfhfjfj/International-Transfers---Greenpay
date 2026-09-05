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
    const payload: NotificationPayload = {
      title: 'Transaction Update',
      body: `Your ${transaction.type} of $${transaction.amount} has been ${transaction.status}`,
      userId,
      type: 'transaction',
      metadata: { transactionId: transaction.id }
    };

    await this.sendNotification(payload);
  }

  async sendSecurityNotification(userId: string, message: string): Promise<void> {
    const payload: NotificationPayload = {
      title: 'Security Alert',
      body: message,
      userId,
      type: 'security'
    };

    await this.sendNotification(payload);
  }
}

export const notificationService = new NotificationService();