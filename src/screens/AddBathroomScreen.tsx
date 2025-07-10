// src/screens/AddBathroomScreen.tsx
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput
} from 'react-native'
import MapView, { LatLng, Marker } from 'react-native-maps'
import { ThemedText, ThemedView } from '../components/Themed'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/themeContext'
import styles from './AddBathroomScreen.styles'

// Sentry for logging
import * as Sentry from '@sentry/react-native'

export function AddBathroomScreen() {
  const { theme } = useTheme()
  const { colors, spacing } = theme

  const [marker, setMarker] = useState<LatLng>({
    latitude: -87.6233,
    longitude: 41.8827,
  })
  const [title, setTitle] = useState('')
  const [entryCode, setEntryCode] = useState('')
  const [instructions, setInstructions] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // user taps map
  const onMapPress = (e: any) => {
    setMarker(e.nativeEvent.coordinate)
  }

  // drag end
  const onDragEnd = (e: any) => {
    setMarker(e.nativeEvent.coordinate)
  }

  const submit = async () => {
    if (!title.trim()) {
      return Alert.alert('Validation', 'Please enter a title for the bathroom.')
    }
    setSubmitting(true)

    const { error } = await supabase
      .from('bathrooms')
      .insert({
        title: title.trim(),
        entry_code: entryCode.trim() || null,
        instructions: instructions.trim() || null,
        lat: marker.latitude,
        lng: marker.longitude,
      })

    setSubmitting(false)
    if (error) {
      console.error(error)
      Sentry.captureMessage(error.message);
      Alert.alert('Error', 'Failed to add bathroom.')
    } else {
      Alert.alert('Success', 'Bathroom added!')
      setTitle('')
      setEntryCode('')
      setInstructions('')
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      /** tweak this if you have a header */
      keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
    <ThemedView style={styles.container}>
      <MapView
        style={styles.mapContainer}
        initialRegion={{
          ...marker,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={onMapPress}
      >
        <Marker
          coordinate={marker}
          draggable
          onDragEnd={onDragEnd}
          pinColor={colors.primary}
        />
      </MapView>

      <ThemedView style={styles.form}>
        <ThemedText style={{ marginBottom: spacing.sm, fontWeight: '600' }}>
          New Bathroom Location
        </ThemedText>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Title"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Entry Code (optional)"
          placeholderTextColor={colors.textSecondary}
          value={entryCode}
          onChangeText={setEntryCode}
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
              height: 80,
              textAlignVertical: 'top',
            },
          ]}
          placeholder="Instructions (optional)"
          placeholderTextColor={colors.textSecondary}
          value={instructions}
          onChangeText={setInstructions}
          multiline
        />

        {submitting ? (
          <ActivityIndicator
            style={styles.buttonContainer}
            color={colors.primary}
          />
        ) : (
          <Button
            title="Add Bathroom"
            color={colors.primary}
            onPress={submit}
          />
        )}
      </ThemedView>
    </ThemedView>
    </ScrollView>
    </KeyboardAvoidingView>
    
  )
}
