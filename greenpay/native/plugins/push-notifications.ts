import { PushNotifications } from '@capacitor/push-notifications';

export const initPushNotifications = async () => {
  try {
    // Request permission
    const result = await PushNotifications.requestPermissions();
    
    if (result.receive === 'granted') {
      // Register for push notifications
      await PushNotifications.register();
      
      // Get token
      const token = await PushNotifications.getDeliveredNotifications();
      console.log('Push Notifications initialized:', token);
    }
  } catch (error) {
    console.error('Push Notifications error:', error);
  }
};

// Listen for notifications
export const setupPushListeners = () => {
  // Handle notification when app is open
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Notification received:', notification);
    // Handle notification in app
  });

  // Handle notification click
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Notification action:', notification);
    // Handle notification tap
  });

  // Handle registration error
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Registration error:', error);
  });
};
