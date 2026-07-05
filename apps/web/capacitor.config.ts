import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.parentscript.app',
  appName: 'ParentScript',
  webDir: 'dist',
  server: {
    // In production the native webview serves the bundled dist/ via a
    // local origin. On iOS this is `capacitor://localhost` and on
    // Android it's `https://localhost` (with the `androidScheme` below).
    // We deliberately do NOT set `url` — that would make the WebView
    // fetch a remote origin instead of the bundled files, which is
    // both slower and a security/availability footgun if the network
    // drops on first launch (one possible cause of the iOS white
    // screen observed on 2026-06-30).
    androidScheme: 'https',
    // Allow cleartext localhost (iOS ATS exception for the Capacitor
    // bridge). Without this, some XHR callbacks to the bridge can be
    // blocked on first launch.
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#6366f1',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'large',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#6366f1',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
    preferredContentMode: 'mobile',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
