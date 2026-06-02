import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wywy.website',
  appName: 'Wywy Website',
  webDir: '../astro-app/dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'http',
  },
};

export default config;
