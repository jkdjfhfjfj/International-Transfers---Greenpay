import { useEffect } from 'react';
import { useToast } from './use-toast';

export const useFCM = (enabled = true) => {
  const { toast } = useToast();

  useEffect(() => {
    const initializeFCM = async () => {
      try {
        if (!enabled) return;
        if (typeof window === 'undefined') return;

        // Browser notifications use the persisted notification feed in App.tsx.
        // Ask once after login so account activity can appear outside the tab.
        if (!(window as any).Capacitor) {
          if ("Notification" in window && Notification.permission === "default") {
            await Notification.requestPermission();
          }
          return;
        }

        // Use indirect import path to avoid Vite pre-bundling the native package
        const pkgName = ['@capacitor', 'push-notifications'].join('/');
        const { PushNotifications } = await import(/* @vite-ignore */ pkgName);

        const permission = await PushNotifications.requestPermissions();
        if (permission.receive !== 'granted') {
          console.log('Push notifications permission denied');
          return;
        }

        await PushNotifications.register();

        let token = '';
        PushNotifications.addListener('registration', (event: any) => {
          token = event.value;
          console.log('FCM Token:', token);
          registerTokenWithBackend(token);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
          console.log('Notification received:', notification);
          const title = notification.title || 'GreenPay';
          const description = notification.body || '';
          toast({ title, description });
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
          console.log('Notification tapped:', notification);
          const type = notification.notification?.data?.type;
          const routes: Record<string, string> = {
            kyc: '/kyc',
            transaction: '/transactions',
            withdrawal: '/withdraw',
            payment: '/bills',
          };
          window.location.href = routes[type] || '/dashboard';
        });

        console.log('FCM initialized successfully');
      } catch (error) {
        console.log('FCM initialization skipped (web app):', error);
      }
    };

    initializeFCM();
  }, [toast, enabled]);
};

async function registerTokenWithBackend(token: string) {
  try {
    await fetch('/api/fcm/register-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch (error) {
    console.error('Failed to register FCM token:', error);
  }
}
