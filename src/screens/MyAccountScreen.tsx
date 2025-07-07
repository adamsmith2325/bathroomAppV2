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

export function MyAccountScreen() {
  const { theme, mode, toggleTheme } = useTheme()
  const { colors, spacing, borderRadius, typography } = theme
  const { user, profile, isPremium, isLoading, signOut } = useSession()

  const [localProfile, setLocalProfile] = useState(profile)
  const [uploading, setUploading] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [savingRadius, setSavingRadius] = useState(false)
  const [processingUpgrade, setProcessingUpgrade] = useState(false)

  useEffect(() => {
    setLocalProfile(profile)
  }, [profile])

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

  const handleSaveName = async () => {
    if (!user || !localProfile) return
    setSavingName(true)
    const { error } = await supabase
      .from('profiles')
      .update({ name: localProfile.name })
      .eq('id', user.id)
    if (error) Alert.alert('Error', error.message)
    setSavingName(false)
  }

  const handleSaveRadius = async () => {
    if (!user || !localProfile) return
    setSavingRadius(true)
    const { error } = await supabase
      .from('profiles')
      .update({ notify_radius: localProfile.notifyRadius })
      .eq('id', user.id)
    if (error) Alert.alert('Error', error.message)
    setSavingRadius(false)
  }

  const handleUpgrade = async () => {
    setProcessingUpgrade(true)
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        { body: { price: 'price_1Ri4JjAmjjNRDdy4cpFIfHUI' } }
      )
      if (error) throw error
      if (data.url) Linking.openURL(data.url)
    } catch (e: any) {
      Alert.alert('Upgrade failed', e.message)
    } finally {
      setProcessingUpgrade(false)
    }
  }

  if (isLoading || !localProfile) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </ThemedView>
    )
  }

  const headerTextStyle: TextStyle = {
    fontSize: typography.header.fontSize,
    fontWeight: typography.header.fontWeight as TextStyle['fontWeight'],
    color: colors.text,
    marginTop: spacing.lg,
  }

  const labelTextStyle: TextStyle = {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight as TextStyle['fontWeight'],
    color: colors.text,
  }

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

      {/* Dark Mode Toggle */}
      <View style={styles.field}>
        <ThemedText style={labelTextStyle}>Dark Mode</ThemedText>
        <Switch
          value={mode === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={mode === 'dark' ? colors.onPrimary : colors.surface}
        />
      </View>

      {/* Name Field */}
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

      {/* Radius Field */}
      <View style={styles.field}>
        <ThemedText style={labelTextStyle}>Notify Radius</ThemedText>
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
          keyboardType="numeric"
          value={String(localProfile.notifyRadius)}
          onChangeText={(t) => {
            const n = Number(t)
            if (!isNaN(n)) {
              setLocalProfile((p) =>
                p ? { ...p, notifyRadius: n } : p
              )
            }
          }}
        />
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
