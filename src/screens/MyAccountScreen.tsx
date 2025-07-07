// src/screens/MyAccountScreen.tsx
import { Picker } from '@react-native-picker/picker'
import * as ImagePicker from 'expo-image-picker'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  Linking,
  Switch,
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

interface LocalProfile {
  id: string
  email: string
  name: string           // ← use “name” here
  avatar_url: string | null
  notifyRadius: number
  is_premium: boolean
}

export function MyAccountScreen() {
  const { theme, mode, toggleTheme } = useTheme()
  const { colors, spacing, borderRadius, typography } = theme
  const { user, profile, isPremium, isLoading, signOut } = useSession()

  // Only seed once from context.profile
  const [localProfile, setLocalProfile] = useState<LocalProfile | null>(null)
  useEffect(() => {
    if (profile && localProfile === null) {
      // Profile from context has shape { name: string, notifyRadius: number, … }
      setLocalProfile({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.avatar_url,
        notifyRadius: profile.notifyRadius,
        is_premium: profile.is_premium,
      })
    }
  }, [profile, localProfile])

  const [uploading, setUploading] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [savingRadius, setSavingRadius] = useState(false)
  const [processingUpgrade, setProcessingUpgrade] = useState(false)

  const radiusOptions = [0, 250, 500, 1000, 2000, 5000]

  // 1) Avatar picker & upload (unchanged)
  const pickAvatar = async () => {
    if (!user) return
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission required', 'You need to allow photo access.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    })
    if (result.canceled) return

    setUploading(true)
    try {
      const uri = result.assets[0].uri
      const resp = await fetch(uri)
      const blob = await resp.blob()
      const ext = uri.split('.').pop()!
      const filename = `${user.id}.${ext}`

      const { error: uploadErr } = await supabase
        .storage
        .from('avatars')
        .upload(filename, blob, { upsert: true })
      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filename)

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id)
      if (updateErr) throw updateErr

      setLocalProfile((p) => p && { ...p, avatar_url: urlData.publicUrl })
    } catch (e: any) {
      Alert.alert('Upload failed', e.message)
    } finally {
      setUploading(false)
    }
  }

  // 2) Save Name
  const handleSaveName = async () => {
    if (!user || !localProfile) return
    setSavingName(true)
    const { data, error } = await supabase
      .from('profiles')
      .update({ name: localProfile.name })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      Alert.alert('Error', error.message)
    } else if (data) {
      // update the local “name” so the UI reflects exactly what’s in the DB
      setLocalProfile((p) => p && { ...p, name: data.name })
    }
    setSavingName(false)
  }

  // 3) Save Radius
  const handleSaveRadius = async () => {
    if (!user || !localProfile) return
    setSavingRadius(true)
    const { data, error } = await supabase
      .from('profiles')
      .update({ notify_radius: localProfile.notifyRadius })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      Alert.alert('Error', error.message)
    } else if (data) {
      setLocalProfile((p) =>
        p ? { ...p, notifyRadius: data.notify_radius } : p
      )
    }
    setSavingRadius(false)
  }

  // inside src/screens/MyAccountScreen.tsx, replace your old handleUpgrade with:

    const handleUpgrade = async () => {
      setProcessingUpgrade(true)
      try {
        // 1) invoke your Edge Function
    const res = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: JSON.stringify({ price: "price_1Ri4JjAmjjNRDdy4cpFIfHUI" }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    // 2) if Supabase-client saw an error, show it
    if (res.error) {
      console.error('🔴 create-checkout-session → error:', res.error)
      throw res.error
    }

    // 3) ensure we got back an object with a `url` property
    const payload = res.data as { url?: string }
    if (!payload || typeof payload.url !== 'string') {
      console.error('🔴 create-checkout-session → bad payload:', res.data)
      throw new Error('Unexpected response from upgrade function')
    }

    // 4) open Stripe Checkout in browser
    await Linking.openURL(payload.url)
  } catch (e: any) {
    console.error('🔴 Upgrade failed:', e)
    Alert.alert('Upgrade failed', e.message ?? String(e))
  } finally {
    setProcessingUpgrade(false)
  }
}

  // 5) Loading or not‐yet‐configured
  if (isLoading || !localProfile) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </ThemedView>
    )
  }

  // Inline text styles
  const headerTextStyle: TextStyle = {
    fontSize: typography.header.fontSize,
    fontWeight: typography.header.fontWeight as TextStyle['fontWeight'],
    color: colors.text,
    marginBottom: spacing.lg,
  }
  const labelTextStyle: TextStyle = {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight as TextStyle['fontWeight'],
    color: colors.text,
  }

  // 6) Render
  return (
    <ThemedView style={styles.container}>
      {/* Avatar */}
      <TouchableOpacity onPress={pickAvatar} disabled={uploading}>
        {localProfile.avatar_url ? (
          <Image
            source={{ uri: localProfile.avatar_url }}
            style={[
              styles.avatarBase,
              {
                width: spacing.md * 4,
                height: spacing.md * 4,
                borderRadius: spacing.md * 2,
              },
            ]}
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

      {/* Header */}
      <ThemedText style={[styles.headerBase, headerTextStyle]}>
        My Account
      </ThemedText>

      {/* Dark Mode */}
      <View style={styles.field}>
        <ThemedText style={labelTextStyle}>Dark Mode</ThemedText>
        <Switch
          value={mode === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={mode === 'dark' ? colors.onPrimary : colors.surface}
        />
      </View>

      {/* Name */}
      <View style={styles.field}>
        <ThemedText style={labelTextStyle}>Name</ThemedText>
        <TextInput
          style={[
            styles.inputBase,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
              borderRadius: borderRadius.md,
              padding: spacing.sm,
              flex: 1,
              marginLeft: spacing.sm,
            },
          ]}
          value={localProfile.name}
          onChangeText={(t) =>
            setLocalProfile((p) => p && { ...p, name: t })
          }
        />
      </View>
      <Button
        title="Save Name"
        color={colors.primary}
        onPress={handleSaveName}
        disabled={savingName}
      />

      {/* Radius */}
      <View style={styles.field}>
        <ThemedText style={labelTextStyle}>Notify Radius</ThemedText>
        <View
          style={{
            flex: 1,
            marginLeft: spacing.sm,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: borderRadius.md,
          }}
        >
          <Picker
            selectedValue={localProfile.notifyRadius}
            onValueChange={(val) =>
              setLocalProfile((p) => p && { ...p, notifyRadius: val })
            }
            dropdownIconColor={colors.textSecondary}
            style={{ color: colors.text }}
          >
            {radiusOptions.map((r) => (
              <Picker.Item
                key={r}
                value={r}
                label={r === 0 ? 'Off' : `${r} ft`}
              />
            ))}
          </Picker>
        </View>
      </View>
      <Button
        title="Save Radius"
        color={colors.primary}
        onPress={handleSaveRadius}
        disabled={savingRadius}
      />

      {/* Membership */}
      <View style={styles.field}>
        <ThemedText style={labelTextStyle}>Membership</ThemedText>
        {isPremium ? (
          <ThemedText style={[labelTextStyle, { color: colors.success }]}>
            Premium Member
          </ThemedText>
        ) : (
          <Button
            title="Upgrade to Premium"
            color={colors.accent}
            onPress={handleUpgrade}
            disabled={processingUpgrade}
          />
        )}
      </View>

      {/* Sign Out */}
      <View style={{ marginTop: spacing.lg }}>
        <Button title="Sign Out" color={colors.error} onPress={signOut} />
      </View>
    </ThemedView>
  )
}
