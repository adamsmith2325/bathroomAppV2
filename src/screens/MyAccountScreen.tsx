// src/screens/MyAccountScreen.tsx
import * as ImagePicker from 'expo-image-picker'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Button,
  Image,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native'
import { ThemedText, ThemedView } from '../components/Themed'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/themeContext'
import { useSession } from '../lib/useSession'
import styles from './MyAccountScreen.styles'

export function MyAccountScreen() {
  const { theme } = useTheme()
  const { colors, spacing, borderRadius, typography } = theme
  const { user, profile, isLoading, signOut } = useSession()

  // Local edit state for name & radius
  const [name, setName] = useState(profile?.name ?? '')
  const [radius, setRadius] = useState(String(profile?.notifyRadius ?? 1000))

  // Avatar upload reuses the same logic you had
  const pickAvatar = async () => {
    if (!user) return
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      alert('Permission to access photos required.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    })
    if (result.canceled) return

    const uri = result.assets[0].uri
    try {
      const resp = await fetch(uri)
      const blob = await resp.blob()
      const ext = uri.split('.').pop() || 'jpg'
      const filename = `${user.id}.${ext}`

      const { error: uploadErr } = await supabase
        .storage.from('avatars')
        .upload(filename, blob, { upsert: true })
      if (uploadErr) throw uploadErr

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filename)

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
    } catch (e) {
      console.error('Avatar upload error:', e)
    }
  }

  // Handlers for updating name & radius
  const saveName = async () => {
    if (!profile) return
    await supabase
      .from('profiles')
      .update({ name })
      .eq('id', profile.id)
  }
  const saveRadius = async () => {
    if (!profile) return
    const notifyRadius = Number(radius)
    if (!isNaN(notifyRadius)) {
      await supabase
        .from('profiles')
        .update({ notifyRadius })
        .eq('id', profile.id)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    )
  }

  // No profile (shouldn’t really happen, upsert in the hook covers this)
  if (!profile) {
    return (
      <ThemedView style={styles.container(spacing.lg)}>
        <ThemedText style={{ color: colors.text }}>
          No profile found.
        </ThemedText>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container(spacing.lg)}>
      <TouchableOpacity onPress={pickAvatar}>
        {profile.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            style={styles.avatar(spacing.md)}
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: colors.surface },
            ]}
          />
        )}
      </TouchableOpacity>

      <ThemedText
        style={[
          styles.header(
            typography.header.fontSize,
            typography.header.fontWeight as TextStyle['fontWeight']
          ),
          { marginTop: spacing.lg, color: colors.text },
        ]}
      >
        My Account
      </ThemedText>

      <TextInput
        placeholder="Name"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
            borderRadius: borderRadius.md,
            padding: spacing.sm,
          },
        ]}
      />
      <Button title="Save Name" color={colors.primary} onPress={saveName} />

      <ThemedText
        style={[
          { marginTop: spacing.lg },
          {
            fontSize: typography.body.fontSize,
            fontWeight: typography.body.fontWeight as TextStyle['fontWeight'],
            color: colors.text,
          } as TextStyle,
        ]}
      >
        Notify me when within:
      </ThemedText>
      <TextInput
        keyboardType="numeric"
        placeholder="1000"
        placeholderTextColor={colors.textSecondary}
        value={radius}
        onChangeText={setRadius}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
            borderRadius: borderRadius.md,
            padding: spacing.sm,
          },
        ]}
      />
      <Button title="Save Radius" color={colors.primary} onPress={saveRadius} />

      <Button title="Sign Out" color={colors.error} onPress={signOut} />
    </ThemedView>
  )
}
