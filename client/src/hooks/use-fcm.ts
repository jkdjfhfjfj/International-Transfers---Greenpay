import { useEffect } from 'react';
import { useToast } from './use-toast';

export const useFCM = () => {
  const { toast } = useToast();

  useEffect(() => {
    const initializeFCM = async () => {
      try {
        // Check if running in native app
        if (!window.Capacitor) return;

        // Import PushNotifications after checking Capacitor is available
        const { PushNotifications } = await import('@capacitor/push-notifications');

        // Request notification permission
        const permission = await PushNotifications.requestPermissions();
        
        if (permission.receive !== 'granted') {
          console.log('Push notifications permission denied');
          return;
        }

        // Register for push notifications
        await PushNotifications.register();

        // Get token for backend registration
        let token = '';
        PushNotifications.addListener('registration', (event) => {
          token = event.value;
          console.log('FCM Token:', token);
          
          // Send token to backend
          registerTokenWithBackend(token);
        });

        // Listen for notifications
        PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            console.log('Notification received:', notification);
            
            // Handle based on type
            if (notification.data?.type === 'kyc') {
              toast({
                title: notification.title || 'KYC Update',
                description: notification.body,
              });
            } else if (notification.data?.type === 'transaction') {
              toast({
                title: notification.title || 'Transaction',
                description: notification.body,
              });
            } else if (notification.data?.type === 'withdrawal') {
              toast({
                title: notification.title || 'Withdrawal',
                description: notification.body,
              });
            } else if (notification.data?.type === 'payment') {
              toast({
                title: notification.title || 'Payment',
                description: notification.body,
              });
            }
          }
        );

        // Handle notification tap
        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification) => {
            console.log('Notification tapped:', notification);
            
            // Navigate based on notification type
            const { type } = notification.notification.data;
            switch (type) {
              case 'kyc':
                window.location.href = '/kyc';
                break;
              case 'transaction':
                window.location.href = '/transactions';
                break;
              case 'withdrawal':
                window.location.href = '/withdraw';
                break;
              case 'payment':
                window.location.href = '/bills';
                break;
              default:
                window.location.href = '/dashboard';
            }
          }
        );

        console.log('FCM initialized successfully');
      } catch (error) {
        console.log('FCM initialization skipped (web app):', error);
      }
    };

    initializeFCM();
  }, [toast]);
};

async function registerTokenWithBackend(token: string) {
  try {
    const response = await fetch('/api/fcm/register-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      console.log('FCM token registered with backend');
    }
  } catch (error) {
    console.error('Failed to register FCM token:', error);
  }
}
