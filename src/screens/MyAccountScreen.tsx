// src/screens/MyAccountScreen.tsx
import * as WebBrowser from 'expo-web-browser'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { supabase } from '../../supabase'
import { darkTheme } from '../design/theme'
import { useTheme } from '../lib/themeContext'
import { useSession } from '../lib/useSession'

export default function MyAccountScreen() {
  const { theme, toggleTheme } = useTheme()
  const { user, isPremium, signOut } = useSession()
  const isDark = theme === darkTheme

  // Local state for full name
  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name ?? ''
  )
  const [saving, setSaving] = useState(false)

  // Resync if user changes
  useEffect(() => {
    setFullName(user?.user_metadata?.full_name ?? '')
  }, [user])

  // Save to both Auth metadata and profiles table
  const handleSaveProfile = async () => {
    setSaving(true)

    // 1) Auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { 'full_name': fullName },
    })
    if (authError) {
      console.error('Auth metadata update error:', authError.message)
    }

    // 2) profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 'full_name': fullName })
      .eq('id', user!.id)
    if (profileError) {
      console.error('Profiles table update error:', profileError.message)
    }

    setSaving(false)
  }

  // Existing upgrade flow
  const handleUpgrade = async () => {
    const resp = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ priceId: 'price_1ReMraAmjjNRDdy4UPN7Nlam' }),
      }
    )
    const { url } = await resp.json()
    await WebBrowser.openBrowserAsync(url)
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          padding: theme.spacing.md,
        },
      ]}
    >
      <Text
        style={{
          fontSize: theme.typography.header.fontSize,
          fontWeight: theme.typography.header.fontWeight,
          color: theme.colors.text,
          marginBottom: theme.spacing.md,
        }}
      >
        My Account
      </Text>

      {/* Full Name Input */}
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        placeholder="Full Name"
        placeholderTextColor={theme.colors.textSecondary}
        style={[
          styles.input,
          {
            borderColor: theme.colors.border,
            color: theme.colors.text,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.sm,
            marginBottom: theme.spacing.lg,
          },
        ]}
      />

      {/* Save Profile */}
      {saving ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : (
        <View style={{ width: '100%', marginBottom: theme.spacing.lg }}>
          <Button
            title="Save Profile"
            onPress={handleSaveProfile}
            color={theme.colors.primary}
          />
        </View>
      )}

      {/* Sign Out */}
      <View style={{ width: '100%', marginBottom: theme.spacing.lg }}>
        <Button title="Sign Out" onPress={signOut} color={theme.colors.error} />
      </View>

      {/* Dark Mode Toggle */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: theme.spacing.lg,
          width: '100%',
        }}
      >
        <Text style={{ flex: 1, color: theme.colors.text }}>Dark Mode</Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.primary,
          }}
          thumbColor={theme.colors.onPrimary}
        />
      </View>

      {/* Upgrade / Manage */}
      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
        <Text style={{ flex: 1, color: theme.colors.text }}>
          {isPremium ? 'Premium Member' : 'Free Tier'}
        </Text>
        <Button
          title={isPremium ? 'Manage' : 'Upgrade'}
          onPress={handleUpgrade}
          color={theme.colors.primary}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',     // horizontal center
    justifyContent: 'center', // vertical center
  },
  input: {
    width: '100%',
    borderWidth: 1,
  },
})
