// app.config.js
import 'dotenv/config';

export default {
  expo: {
    name: 'bathroomAppV2',
    slug: 'bathroomAppV2',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'bathroomappv2',
    android: {
      package: 'com.prismixlabs.bathroomappv2',    // ← REQUIRED: choose your reverse-domain ID
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
    },
    ios: {
      bundleIdentifier: 'com.prismixlabs.bathroomappv2',  // ← RECOMMENDED: match your Android package
      supportsTablet: true,
    },
    newArchEnabled: true,
    experiments: {
      typedRoutes: true,
    },
    extra: {
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      APP_SCHEME: 'bathroomappv2',
    },
  },
};
