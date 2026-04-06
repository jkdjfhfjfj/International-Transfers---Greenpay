import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.greenpay.mobile',
  appName: 'GreenPay',
  webDir: 'client/dist',
  server: {
    androidScheme: 'https',
    url: process.env.CAPACITOR_SERVER_URL || 'https://greenpay.world',
    cleartext: process.env.CAPACITOR_ALLOW_CLEARTEXT === 'true',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
