import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.frontend.engineer',
  appName: 'TechPro',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
