// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { LogBox, Platform } from 'react-native';

import { MobileAds } from 'react-native-google-mobile-ads';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GEOFENCE_TASK } from './src/background/geofenceTask';
import { supabase } from './src/lib/supabase';
import { ThemeProvider } from './src/lib/themeContext';
import { SessionProvider, useSession } from './src/lib/useSession';
import { MainTabs } from './src/navigation/BottomTabNavigator';
import AuthScreen from './src/screens/AuthScreen';


Sentry.init({
  dsn: 'https://10c0e6ed16a7f81729cf942aa156b4b9@o4509606265618432.ingest.us.sentry.io/4509606267781120',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});


MobileAds()
  .initialize()
  .then(adapterStatuses => {
    console.log('✅ Mobile Ads initialized:', adapterStatuses);
    Sentry.captureMessage("✅ Mobile Ads initialized");
    
  })
  .catch(err => {
    console.error('❌ Mobile Ads failed to initialize:', err);
    Sentry.captureMessage("❌ Mobile Ads failed to initialize:" + err);
  });

// silences irrelevant RN warnings in your dashboard
LogBox.ignoreLogs(['Setting a timer']);

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    return {
      shouldShowAlert: true,    // show the alert popup
      shouldPlaySound: false,   // no sound
      shouldSetBadge: false,    // no badge count
      shouldShowBanner: true,   // iOS 14+ banner
      shouldShowList: true,     // show in notification center on Android
    }
  },
})

function Root() {
   const { session } = useSession();



  
  // register a listener so tapping the notif navigates
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(resp => {
      const bathroomId = resp.notification.request.content.data.bathroomId
      // you’ll need to get a navigation ref here to navigate
      // to your BathroomDetail screen, e.g.
      // navigationRef.current?.navigate('BathroomDetail', { id: bathroomId })
    })
    return () => sub.remove()
  }, [])

  return (
    <>
    <NavigationContainer>
      {session ? <MainTabs /> : <AuthScreen />}
    </NavigationContainer>
    </>
  )
}

export default Sentry.wrap(function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ThemeProvider>
          <GeofenceRegistrar />
          <Root />
          {/* <WelcomeModal
            visible={showWelcome}
            onClose={() => setShowWelcome(false)}
          /> */}
        </ThemeProvider>
      </SessionProvider>
    </SafeAreaProvider>
  )
});

/** component that requests permission + starts geofencing */
function GeofenceRegistrar() {
  useEffect(() => {
    ;(async () => {
      // 1) permissions
      const { status: fg } = await Location.requestForegroundPermissionsAsync()
      const { status: bg } =
        Platform.OS === 'android'
          ? await Location.requestBackgroundPermissionsAsync()
          : { status: 'granted' }
      if (fg !== 'granted' || bg !== 'granted') return

      // 2) load radius
      const { data: profile } = await supabase
        .from('profiles')
        .select('notify_radius')
        .single()
      const radiusFeet = profile?.notify_radius ?? 0

      // if user turned alerts OFF, stop any running geofences & exit
      if (radiusFeet <= 0) {
        await Location.stopGeofencingAsync(GEOFENCE_TASK)
        return
      }

      // 3) else load bathrooms & register
      const { data: baths } = await supabase
        .from('bathrooms')
        .select('id, latitude, longitude')
      const regions = baths!.map((b) => ({
        identifier: b.id.toString(),
        latitude: b.latitude,
        longitude: b.longitude,
        radius: radiusFeet * 0.3048, // convert ft → meters
      }))

      await Location.startGeofencingAsync(GEOFENCE_TASK, regions)
    })()
  }, [])

  return null
}