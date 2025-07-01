// App.tsx
import { NavigationContainer } from '@react-navigation/native'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import React, { useEffect } from 'react'
import { Platform } from 'react-native'
import { GEOFENCE_TASK } from './src/background/geofenceTask'
import { ThemeProvider } from './src/lib/themeContext'
import { SessionProvider, useSession } from './src/lib/useSession'
import BottomTabNavigator from './src/navigation/BottomTabNavigator'
import { AuthScreen } from './src/screens/AuthScreen'
import { supabase } from './supabase'


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
  const { session } = useSession()

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
    <NavigationContainer>
      {session ? <BottomTabNavigator /> : <AuthScreen />}
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <GeofenceRegistrar />
        <Root />
      </ThemeProvider>
    </SessionProvider>
  )
}

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
        .select('alert_radius')
        .single()
      const radiusFeet = profile?.alert_radius ?? 0

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
