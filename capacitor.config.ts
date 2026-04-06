import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.greenpay.mobile',
  appName: 'GreenPay',
  webDir: 'client/dist',
  server: {
    androidScheme: 'https',
    // Backend API URL for Android app
    // Set to your production backend URL
    // Examples:
    // - Production: https://api.greenpay.world
    // - Development: http://192.168.1.100:5000 (use your local IP)
    // - Localhost emulator: http://10.0.2.2:5000
    url: process.env.CAPACITOR_SERVER_URL || 'https://api.greenpay.world',
    cleartext: process.env.CAPACITOR_ALLOW_CLEARTEXT === 'true', // Allow HTTP in development
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
