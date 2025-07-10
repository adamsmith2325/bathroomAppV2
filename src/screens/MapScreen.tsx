import * as Location from 'expo-location'
import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import MapView, { Marker } from 'react-native-maps'

import BathroomDetailsModal from '../components/BathroomDetailsModal'
import { ThemedText, ThemedView } from '../components/Themed'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/themeContext'
import { useSession } from '../lib/useSession'
import styles from './MapScreen.styles'

export interface Bathroom {
  id: string
  title: string
  entry_code?: string
  instructions?: string
  lat: number
  lng: number
}

export default function MapScreen() {
  const { theme } = useTheme()
  const { colors } = theme
  const { user, isPremium } = useSession()

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([])
  const [selectedBathroom, setSelectedBathroom] = useState<Bathroom | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  // Get user location
  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need location access.')
        return
      }
      const loc = await Location.getCurrentPositionAsync({})
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      })
    })()
  }, [])

  // Load bathrooms from Supabase
  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.from('bathrooms').select('*')
      if (error) {
        console.error('Failed to load bathrooms', error)
      } else if (data) {
        setBathrooms(data as Bathroom[])
      }
    })()
  }, [])

  const handleMarkerPress = (bathroom: Bathroom) => {
    setSelectedBathroom(bathroom)
    setModalVisible(true)
  }

  if (!location) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Getting location…</ThemedText>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {bathrooms.map((b) => (
          <Marker
            key={b.id}
            coordinate={{ latitude: b.lat, longitude: b.lng }}
            title={b.title}
            pinColor={colors.accent}
            onPress={() => handleMarkerPress(b)}
          />
        ))}
        <Marker
          coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          title="You are here"
          pinColor={colors.primary}
        />
      </MapView>

      <BathroomDetailsModal
        bathroom={selectedBathroom}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </ThemedView>
  )
}
