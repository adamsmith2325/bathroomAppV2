// src/screens/MyAccountScreen.tsx

/**
 * MyAccountScreen
 *
 * - Edit your full name (updates both Auth user_metadata and `profiles.full_name`)
 * - Choose your alert radius (0 = No Alerts) and save to `profiles.alert_radius`
 * - Sign out
 * - Toggle light/dark theme
 * - Upgrade or manage your subscription via Supabase Edge Function
 */

import { Picker } from '@react-native-picker/picker'
import * as WebBrowser from 'expo-web-browser'
import React, { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Platform,
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

const RADIUS_OPTIONS = [
  { label: 'No Alerts', value: 0 },
  { label: '100 ft', value: 100 },
  { label: '200 ft', value: 200 },
  { label: '300 ft', value: 300 },
  { label: '400 ft', value: 400 },
  { label: '500 ft', value: 500 },
  { label: '600 ft', value: 600 },
  { label: '700 ft', value: 700 },
  { label: '800 ft', value: 800 },
  { label: '900 ft', value: 900 },
  { label: '1000 ft', value: 1000 },
]

export default function MyAccountScreen() {
  const { theme, toggleTheme } = useTheme()
  const { user, isPremium, signOut } = useSession()

  // Local state
  const [fullName, setFullName] = useState<string>('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [radius, setRadius] = useState<number>(200)
  const [savingRadius, setSavingRadius] = useState(false)

  // Load initial profile values
  useEffect(() => {
    if (!user) return

    ;(async () => {
      // Fetch from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, alert_radius')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Failed loading profile', error.message)
      } else {
        setFullName(data.full_name ?? '')
        setRadius(data.alert_radius ?? 0)
      }
    })()
  }, [user])

  // Save full_name to Auth metadata & profiles table
  const handleSaveProfile = async () => {
    setSavingProfile(true)

    // Update Auth user_metadata
    const { error: authErr } = await supabase.auth.updateUser({
      data: { ['full_name']: fullName },
    })
    if (authErr) {
      console.error('Auth metadata update error:', authErr.message)
      Alert.alert('Error', 'Could not save your name.')
    }

    // Update profiles.full_name
    const { error: profErr } = await supabase
      .from('profiles')
      .update({ ['full_name']: fullName })
      .eq('id', user!.id)
    if (profErr) {
      console.error('Profiles table update error:', profErr.message)
      Alert.alert('Error', 'Could not save your profile.')
    } else {
      Alert.alert('Success', 'Your name was saved!')
    }

    setSavingProfile(false)
  }

  // Save alert_radius to profiles table
  const handleSaveRadius = async () => {
    setSavingRadius(true)

    const { error } = await supabase
      .from('profiles')
      .update({ alert_radius: radius })
      .eq('id', user!.id)

    setSavingRadius(false)

    if (error) {
      console.error('Radius save error:', error.message)
      Alert.alert('Error', 'Could not save your alert radius.')
    } else {
      Alert.alert(
        'Success',
        radius === 0
          ? 'Alerts turned OFF.'
          : `You’ll be notified within ${radius} ft.`
      )
    }
  }

  // Launch Stripe checkout via Supabase Edge Function
  const handleUpgrade = async () => {
    try {
      const resp = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
          body: JSON.stringify({ priceId: 'price_1ReMraAmjjNRDdy4UPN7Nlam' }),
        }
      )
      const text = await resp.text()

      if (!resp.ok) {
        console.error(`Function error (${resp.status}):`, text)
        Alert.alert('Upgrade failed', text)
        return
      }

      const { url } = JSON.parse(text)
      if (!url) {
        Alert.alert('Upgrade failed', 'No checkout URL returned.')
        return
      }

      await WebBrowser.openBrowserAsync(url)
    } catch (err: any) {
      console.error('Unexpected upgrade error:', err)
      Alert.alert('Upgrade failed', err.message || String(err))
    }
  }

  const isDark = theme === darkTheme

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text
        style={{
          fontSize: theme.typography.header.fontSize,
          fontWeight: theme.typography.header.fontWeight as any,
          color: theme.colors.text,
          marginBottom: theme.spacing.md,
        }}
      >
        My Account
      </Text>

      {/* Full Name */}
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
      <View style={{ width: '100%', marginBottom: theme.spacing.lg }}>
        <Button
          title={savingProfile ? 'Saving…' : 'Save Name'}
          onPress={handleSaveProfile}
          color={theme.colors.primary}
          disabled={savingProfile}
        />
      </View>

      {/* Alert Radius */}
      <Text style={{ color: theme.colors.text, marginBottom: theme.spacing.sm }}>
        Notify me when within:
      </Text>
      <View style={styles.pickerRow}>
        <Picker
          selectedValue={radius}
          style={{ flex: 1, color: theme.colors.text }}
          onValueChange={(v) => setRadius(v as number)}
          mode={Platform.OS === 'android' ? 'dropdown' : 'dialog'}
        >
          {RADIUS_OPTIONS.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
        <Button
          title={savingRadius ? 'Saving…' : 'Save Radius'}
          onPress={handleSaveRadius}
          color={theme.colors.primary}
          disabled={savingRadius}
        />
      </View>

      {/* Theme Toggle */}
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

      {/* Subscription */}
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

          {/* Sign Out */}
      <View style={{ width: '100%', marginBottom: theme.spacing.lg }}>
        <Button title="Sign Out" onPress={signOut} color={theme.colors.error} />
      </View>

      
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
})
