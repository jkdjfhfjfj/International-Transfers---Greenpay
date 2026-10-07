import fetch from 'node-fetch';

const FCM_API_URL = 'https://fcm.googleapis.com/v1/projects';

interface FCMMessage {
  token?: string;
  topic?: string;
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
  android?: {
    priority: 'high' | 'normal';
    notification: {
      sound: string;
      click_action: string;
    };
  };
}

export class FCMService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private projectId: string;

  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID || 'greenpay-mobile';
  }

  private async getAccessToken(): Promise<string> {
    try {
      if (this.accessToken && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
      );

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: serviceAccount.client_id,
          client_secret: serviceAccount.client_secret,
          refresh_token: serviceAccount.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json() as any;
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      return this.accessToken!;
    } catch (error) {
      console.error('FCM token error:', error);
      throw new Error('Failed to get FCM access token');
    }
  }

  async sendToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const message: FCMMessage = {
        token,
        notification: { title, body },
        data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
      };

      const response = await fetch(
        `${FCM_API_URL}/${this.projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        }
      );

      const result = await response.json() as any;
      console.log('FCM sent successfully:', result.name);
      return true;
    } catch (error) {
      console.error('FCM send error:', error);
      return false;
    }
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const message: FCMMessage = {
        topic,
        notification: { title, body },
        data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
      };

      const response = await fetch(
        `${FCM_API_URL}/${this.projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        }
      );

      const result = await response.json() as any;
      console.log('FCM topic sent successfully:', result.name);
      return true;
    } catch (error) {
      console.error('FCM topic send error:', error);
      return false;
    }
  }

  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ success: number; failure: number }> {
    try {
      const accessToken = await this.getAccessToken();
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < tokens.length; i += 500) {
        const batch = tokens.slice(i, i + 500);

        for (const token of batch) {
          try {
            const message: FCMMessage = {
              token,
              notification: { title, body },
              data,
              android: {
                priority: 'high',
                notification: {
                  sound: 'default',
                  click_action: 'FLUTTER_NOTIFICATION_CLICK',
                },
              },
            };

            await fetch(
              `${FCM_API_URL}/${this.projectId}/messages:send`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
              }
            );
            successCount++;
          } catch {
            failureCount++;
          }
        }
      }

      console.log(`FCM multicast: ${successCount} success, ${failureCount} failures`);
      return { success: successCount, failure: failureCount };
    } catch (error) {
      console.error('FCM multicast error:', error);
      return { success: 0, failure: tokens.length };
    }
  }
}

export const fcmService = new FCMService();
