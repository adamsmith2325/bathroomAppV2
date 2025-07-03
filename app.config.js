// app.config.js
import 'dotenv/config';

export default {
  expo: {
    name: 'bathroomAppV2',
    slug: 'bathroomAppV2',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icons/loo-pin.png',
    userInterfaceStyle: 'automatic',
    scheme: 'bathroomappv2',
    android: {
      package: 'com.prismixlabs.bathroomappv2',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      config: {
        googleMapsApiKey: "AIzaSyDnWXSd8RvTVKJZ0wVxZuojLCkZWcekPHM"
      }
    },
    ios: {
      bundleIdentifier: 'com.prismixlabs.bathroomappv2',
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      config: {
        googleMapsApiKey: "AIzaSyDnWXSd8RvTVKJZ0wVxZuojLCkZWcekPHM"
      }
    },
    newArchEnabled: true,
    experiments: {
      typedRoutes: true,
    },
    extra: {
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      APP_SCHEME: 'bathroomappv2',
      eas: {
        projectId: '481da270-bcf7-4904-8a63-7221c7b46f29',
      },
    },
    plugins: [
      // [
      //   'react-native-google-mobile-ads',
      //   {
      //     // Your AdMob App IDs from the AdMob console:
      //     android_app_id: 'ca-app-pub-5901242452853695~2399952491',
      //     ios_app_id: 'ca-app-pub-5901242452853695~2944530360',
      //   },

      // ],
      [
      "@sentry/react-native/expo",
        {
          "url": "https://sentry.io/",
          "project": "react-native",
          "organization": "prismix-labs"
        }
      ],
      'expo-dev-client'
    ],
  },
};
