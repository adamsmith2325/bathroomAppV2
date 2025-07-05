// src/screens/MyAccountScreen.tsx
import * as ImagePicker from 'expo-image-picker'
import React, { useEffect, useState } from 'react'
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

interface Profile {
  id: string
  email: string
  name: string
  avatar_url: string | null
  notifyRadius: number
}

export function MyAccountScreen() {
  const { theme } = useTheme()
  const { colors, spacing, borderRadius, typography } = theme
  const { user } = useSession()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // 1) Fetch profile once `user` is known
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, name, avatar_url, notifyRadius')
          .eq('id', user.id)
          .single()
        if (error) throw error
        if (mounted) setProfile(data)
      } catch (e) {
        console.error('Fetch profile error:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [user])

  // 2) Avatar picker using `canceled` & `assets[0].uri`
  const pickAvatar = async () => {
    if (!user) return
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      alert('Permission to access your photos is required!')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    })

    // expo-image-picker v14+ uses `canceled` and `assets`
    if (result.canceled) return
    const asset = result.assets[0]
    const uri = asset.uri

    setLoading(true)
    try {
      const response = await fetch(uri)
      const blob = await response.blob()
      const ext = uri.split('.').pop()
      const filename = `${user.id}.${ext}`

      const { error: uploadErr } = await supabase
        .storage
        .from('avatars')
        .upload(filename, blob, { upsert: true })
      if (uploadErr) throw uploadErr

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filename)

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
      setProfile((p) => (p ? { ...p, avatar_url: publicUrl } : p))
    } catch (e) {
      console.error('Avatar upload error:', e)
    } finally {
      setLoading(false)
    }
  }

  // Show spinner until session & profile load
  if (loading) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    )
  }

  // If no profile row found
  if (!profile) {
    return (
      <ThemedView style={styles.container(spacing.lg)}>
        <ThemedText style={{ color: colors.text }}>
          No profile found. Please complete sign-up.
        </ThemedText>
      </ThemedView>
    )
  }

  // 3) Prepare header style as a TextStyle
  const headerStyle = {
    fontSize: typography.header.fontSize,
    fontWeight: typography.header.fontWeight as TextStyle['fontWeight'],
    marginTop: spacing.xl,
    color: colors.text,
  } as TextStyle

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

      <ThemedText style={headerStyle}>My Account</ThemedText>

      <TextInput
        placeholder="Name"
        placeholderTextColor={colors.textSecondary}
        value={profile.name}
        onChangeText={(val) =>
          setProfile((p) => (p ? { ...p, name: val } : p))
        }
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
      <Button
        title="Save Name"
        color={colors.primary}
        onPress={async () => {
          setLoading(true)
          await supabase
            .from('profiles')
            .update({ name: profile.name })
            .eq('id', profile.id)
          setLoading(false)
        }}
      />

<ThemedText
  style={[
    { marginTop: spacing.lg },
    {
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight as TextStyle['fontWeight'],
    } as TextStyle,
  ]}
>
  Notify me when within:
</ThemedText>
      <TextInput
        keyboardType="numeric"
        placeholder="e.g. 1000"
        placeholderTextColor={colors.textSecondary}
        value={String(profile.notifyRadius)}
        onChangeText={(val) => {
          const num = Number(val)
          if (!isNaN(num)) {
            setProfile((p) =>
              p ? { ...p, notifyRadius: num } : p
            )
          }
        }}
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
      <Button
        title="Save Radius"
        color={colors.primary}
        onPress={async () => {
          setLoading(true)
          await supabase
            .from('profiles')
            .update({ notifyRadius: profile.notifyRadius })
            .eq('id', profile.id)
          setLoading(false)
        }}
      />

      <Button
        title="Sign Out"
        color={colors.error}
        onPress={() => supabase.auth.signOut()}
      />
    </ThemedView>
  )
}
