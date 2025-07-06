// src/screens/AuthScreen.tsx

import React, { useState } from 'react'
import {
  ActivityIndicator,
  Image,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native'
import { ThemedText, ThemedView } from '../components/Themed'
import { useTheme } from '../lib/themeContext'
import { useSession } from '../lib/useSession'
import styles from './AuthScreen.styles'

// make sure your logo lives at src/assets/logo.png
import logo from '../../assets/icons/loo-pin.png'

export default function AuthScreen() {
  const { theme } = useTheme()
  const { colors, spacing, borderRadius, typography } = theme
  const { signIn, signUp } = useSession()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSigningUp, setIsSigningUp] = useState(false)

  // extract header style as a typed TextStyle
  const headerTextStyle: TextStyle = {
    fontSize: typography.header.fontSize,
    fontWeight: typography.header.fontWeight as TextStyle['fontWeight'],
    color: colors.text,
    marginBottom: spacing.sm,
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isSigningUp) {
        await signUp(email.trim(), password)
      } else {
        await signIn(email.trim(), password)
      }
    } catch (e: any) {
      setError(e.message ?? 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Image source={logo} style={styles.logo} />

      <ThemedText style={[styles.title, headerTextStyle]}>
        {isSigningUp ? 'Create Account' : 'Welcome Back'}
      </ThemedText>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {error && (
          <ThemedText
            style={[
              styles.errorText,
              { color: colors.error },
              { fontSize: 16, fontWeight: '600' }
            ]}
          >
            {error}
          </ThemedText>
        )}

        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={[
            styles.input,
            { backgroundColor: colors.background, borderColor: colors.border },
            {
              fontSize: typography.body.fontSize,
              fontWeight: typography.body.fontWeight as TextStyle['fontWeight'],
              color: colors.text,
            } as TextStyle,
          ]}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={[
            styles.input,
            { backgroundColor: colors.background, borderColor: colors.border },
            {
              fontSize: typography.body.fontSize,
              fontWeight: typography.body.fontWeight as TextStyle['fontWeight'],
              color: colors.text,
            } as TextStyle,
          ]}
        />

        {loading ? (
          <ActivityIndicator
            style={styles.buttonContainer}
            size="large"
            color={colors.primary}
          />
        ) : (
          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.sm,
                marginTop: spacing.sm,
              },
            ]}
          >
            <ThemedText
              style={[
                {
                  fontSize: typography.body.fontSize,
                  fontWeight: '600' as TextStyle['fontWeight'],
                  color: colors.onPrimary,
                  textAlign: 'center',
                },
              ]}
            >
              {isSigningUp ? 'Sign Up' : 'Sign In'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={() => setIsSigningUp((p) => !p)}>
        <ThemedText
          style={[
            styles.toggleText,
            {
              fontSize: typography.body.fontSize,
              fontWeight: typography.body.fontWeight as TextStyle['fontWeight'],
              color: colors.primary,
            } as TextStyle,
          ]}
        >
          {isSigningUp
            ? 'Already have an account? Sign In'
            : "Don't have an account? Sign Up"}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  )
}
