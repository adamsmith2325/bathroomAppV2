// src/screens/MyAccountScreen.tsx

/**
 * NOTE on snake_case keys:
 * Whenever we write to a snake_case column or metadata field
 * (like "full_name"), we must use a computed property:
 *    { ['full_name']: value }
 * so TypeScript treats it as a string key, not an undefined identifier.
 */

import * as WebBrowser from 'expo-web-browser'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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

  // Keep the input updated if user changes
  useEffect(() => {
    setFullName(user?.user_metadata?.full_name ?? '')
  }, [user])

  // Save full_name into both Auth metadata and profiles table
  const handleSaveProfile = async () => {
    setSaving(true)

    // 1) Auth metadata update
    const { error: authError } = await supabase.auth.updateUser({
      data: { ['full_name']: fullName },
    })
    if (authError) {
      console.error('Auth metadata update error:', authError.message)
      Alert.alert('Error saving name', authError.message)
    }

    // 2) Profiles table update
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ ['full_name']: fullName })
      .eq('id', user!.id)
    if (profileError) {
      console.error('Profiles table update error:', profileError.message)
      Alert.alert('Error saving profile', profileError.message)
    }

    setSaving(false)
  }

  // Open Stripe checkout via your Supabase Edge Function
  const handleUpgrade = async () => {
    try {
      const { data, error } = await supabase.functions.invoke<{ url: string }>(
        'create-checkout-session',
        {
          body: { priceId: 'price_1ReMraAmjjNRDdy4UPN7Nlam' },
        }
      )

      // Handle any function-level error
      if (error) {
        console.error('Function invoke error:', error)
        Alert.alert('Upgrade failed', error.message)
        return
      }

      // Ensure the function returned a URL
      if (!data?.url) {
        console.error('Function returned no url field:', data)
        Alert.alert('Upgrade failed', 'No checkout URL returned.')
        return
      }

      // Launch the Stripe Checkout page
      await WebBrowser.openBrowserAsync(data.url)
    } catch (err: any) {
      console.error('Unexpected upgrade error:', err)
      Alert.alert('Upgrade failed', err.message || String(err))
    }
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

      {/* Save Profile Button */}
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

      {/* Sign Out Button */}
      <View style={{ width: '100%', marginBottom: theme.spacing.lg }}>
        <Button
          title="Sign Out"
          onPress={signOut}
          color={theme.colors.error}
        />
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

      {/* Upgrade / Manage Subscription */}
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
    alignItems: 'center',     // horizontal centering
    justifyContent: 'center', // vertical centering
  },
  input: {
    width: '100%',
    borderWidth: 1,
  },
})
