import { storage } from '../storage';
import { fcmService } from './fcm';

export interface PushNotificationPayload {
  userId?: string;
  title: string;
  body: string;
  type: 'kyc' | 'transaction' | 'withdrawal' | 'payment' | 'general' | 'alert';
  data?: Record<string, string>;
  targetUserIds?: string[]; // For admin bulk sends
  sendToAll?: boolean; // Send to all users
}

export class NotificationQueue {
  async sendKYCNotification(userId: string, status: string) {
    return this.queueNotification({
      userId,
      title: '📋 KYC Status Update',
      body:
        status === 'verified'
          ? 'Your KYC verification is complete! Welcome.'
          : status === 'pending'
            ? 'Your KYC documents are being reviewed.'
            : 'KYC verification failed. Please resubmit.',
      type: 'kyc',
      data: { kyc_status: status },
    });
  }

  async sendTransactionNotification(
    userId: string,
    type: 'sent' | 'received',
    amount: string,
    senderName?: string
  ) {
    return this.queueNotification({
      userId,
      title: type === 'sent' ? '💸 Money Sent' : '💰 Money Received',
      body:
        type === 'sent'
          ? `You sent $${amount}`
          : `${senderName || 'Someone'} sent you $${amount}`,
      type: 'transaction',
      data: { transaction_type: type, amount },
    });
  }

  async sendWithdrawalNotification(
    userId: string,
    status: 'pending' | 'completed' | 'failed',
    amount: string
  ) {
    const titles = {
      pending: '⏳ Withdrawal Pending',
      completed: '✅ Withdrawal Completed',
      failed: '❌ Withdrawal Failed',
    };

    const bodies = {
      pending: `Withdrawal of $${amount} is being processed.`,
      completed: `You received $${amount} to your account.`,
      failed: `Withdrawal of $${amount} could not be completed.`,
    };

    return this.queueNotification({
      userId,
      title: titles[status],
      body: bodies[status],
      type: 'withdrawal',
      data: { withdrawal_status: status, amount },
    });
  }

  async sendBillPaymentNotification(
    userId: string,
    status: 'pending' | 'completed' | 'failed',
    provider: string,
    amount: string
  ) {
    const titles = {
      pending: '⏳ Bill Payment Pending',
      completed: '✅ Bill Paid Successfully',
      failed: '❌ Bill Payment Failed',
    };

    const bodies = {
      pending: `Payment to ${provider} for $${amount} is processing.`,
      completed: `Your ${provider} bill of $${amount} has been paid.`,
      failed: `Payment to ${provider} for $${amount} failed.`,
    };

    return this.queueNotification({
      userId,
      title: titles[status],
      body: bodies[status],
      type: 'payment',
      data: { payment_status: status, provider, amount },
    });
  }

  async sendAirtimeNotification(
    userId: string,
    phoneNumber: string,
    amount: string
  ) {
    return this.queueNotification({
      userId,
      title: '📱 Airtime Purchased',
      body: `${amount} airtime sent to ${phoneNumber}`,
      type: 'transaction',
      data: { airtime_amount: amount, phone: phoneNumber },
    });
  }

  async sendAdminAlert(userId: string, title: string, message: string) {
    return this.queueNotification({
      userId,
      title,
      body: message,
      type: 'alert',
    });
  }

  async sendBulkNotification(payload: PushNotificationPayload) {
    try {
      let targetUserIds = payload.targetUserIds || [];

      if (payload.sendToAll) {
        // Get all users with FCM tokens
        const users = await storage.getAllUsers();
        targetUserIds = users.filter((u: any) => u.fcmToken).map((u: any) => u.id);
      }

      if (targetUserIds.length === 0) {
        console.warn('No target users for bulk notification');
        return { success: 0, failure: 0 };
      }

      // Get FCM tokens for all target users
      const users = await Promise.all(
        targetUserIds.map((id) => storage.getUser(id))
      );
      const tokens = users
        .filter((u): u is any => u && u.fcmToken)
        .map((u) => u.fcmToken);

      if (tokens.length === 0) {
        console.warn('No FCM tokens found for target users');
        return { success: 0, failure: targetUserIds.length };
      }

      // Send via FCM multicast
      const result = await fcmService.sendMulticast(
        tokens,
        payload.title,
        payload.body,
        payload.data
      );

      console.log(
        `Bulk notification sent: ${result.success} success, ${result.failure} failures`
      );
      return result;
    } catch (error) {
      console.error('Bulk notification error:', error);
      return { success: 0, failure: 0 };
    }
  }

  private async queueNotification(payload: PushNotificationPayload) {
    try {
      if (!payload.userId && !payload.sendToAll && !payload.targetUserIds) {
        console.warn('No target specified for notification');
        return false;
      }

      // For single user
      if (payload.userId && !payload.sendToAll) {
        const user = await storage.getUser(payload.userId);
        if (!user || !user.fcmToken) {
          console.warn(`No FCM token for user ${payload.userId}`);
          return false;
        }

        return await fcmService.sendToToken(
          user.fcmToken,
          payload.title,
          payload.body,
          payload.data
        );
      }

      // For bulk/all
      return await this.sendBulkNotification(payload);
    } catch (error) {
      console.error('Notification queue error:', error);
      return false;
    }
  }
}

export const notificationQueue = new NotificationQueue();
