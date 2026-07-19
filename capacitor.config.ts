import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5656f21d6ae04ac99bae6684001a8f4b',
  appName: 'aleksey',
  webDir: 'dist',
  server: {
    url: 'https://5656f21d-6ae0-4ac9-9bae-6684001a8f4b.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#1a1a1a',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
