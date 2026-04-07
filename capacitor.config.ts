import { CapacitorConfig } from '@capacitor/cli';

const isDev = !!process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.greenpay.mobile',
  appName: 'GreenPay',
  webDir: 'client/dist',
  server: isDev
    ? {
        androidScheme: 'https',
        url: process.env.CAPACITOR_SERVER_URL,
        cleartext: process.env.CAPACITOR_ALLOW_CLEARTEXT === 'true',
      }
    : {
        androidScheme: 'https',
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
