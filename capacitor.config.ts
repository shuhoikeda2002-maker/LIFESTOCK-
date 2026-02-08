import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lifestock.app',
  appName: 'Life Stock',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    ScreenOrientation: {
      orientation: 'landscape'
    }
  }
};

export default config;
