// src/screens/MyAccountScreen.tsx
import React, { useState } from 'react'
import {
  ActivityIndicator,
  TextStyle
} from 'react-native'
import { ThemedText, ThemedView } from '../components/Themed'
import { useTheme } from '../lib/themeContext'
import styles from './MyAccountScreen.styles'

export function MyAccountScreen() {
  const { theme } = useTheme()
  const { colors, spacing, borderRadius, typography } = theme

  const [profile, setProfile] = useState({
    id: '',
    email: '',
    name: '',
    avatar_url: null as string | null,
    notifyRadius: 1000,
  })
  const [loading, setLoading] = useState(true)

  // ... fetchProfile, updateProfile, pickAvatar unchanged ...

  if (loading) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </ThemedView>
    )
  }

  // destructure header typography for clarity
  const { fontSize, fontWeight } = typography.header

  return (
    <ThemedView style={styles.container(spacing.lg)}>
      {/* avatar picker omitted for brevity */}

      {/* CAST fontWeight to React Native's TextStyle['fontWeight'] */}
      <ThemedText
        style={styles.header(
          fontSize,
          fontWeight as TextStyle['fontWeight']
        )}
      >
        My Account
      </ThemedText>

      {/* rest of your inputs/buttons */}
    </ThemedView>
  )
}
