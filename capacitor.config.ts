import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dlms.app',
  appName: 'DLMS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
