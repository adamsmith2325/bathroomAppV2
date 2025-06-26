// src/screens/MyAccountScreen.tsx
import * as Linking from 'expo-linking';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../lib/themeContext';
import { useSession } from '../lib/useSession';

export default function MyAccountScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, isPremium, signOut } = useSession();
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);

  // Replace with your deployed Edge Function URL
  const CHECKOUT_URL = 'https://vxpsejfhhopapckmtaux.supabase.co/functions/v1/create-checkout-session';

  const handleUpgrade = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingUpgrade(true);
      const res = await fetch(CHECKOUT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      const { url } = await res.json();
      if (url) {
        Linking.openURL(url);
      } else {
        throw new Error('No URL returned');
      }
    } catch (err: any) {
      console.error('Checkout session error', err);
      Alert.alert('Error', 'Could not start checkout.');
    } finally {
      setLoadingUpgrade(false);
    }
  }, [user]);

  return (
    <View style={{
      flex: 1,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    }}>
      <Text style={{
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: theme.spacing.md,
      }}>
        Account
      </Text>

      <Text style={{
        color: theme.colors.text,
        fontSize: 16,
        marginBottom: theme.spacing.lg,
      }}>
        {user?.email}
      </Text>

      {/* Dark Mode Toggle */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
      }}>
        <Text style={{
          color: theme.colors.text,
          fontSize: 16,
          marginRight: theme.spacing.md,
        }}>
          Dark Mode
        </Text>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          trackColor={{ false: '#ccc', true: theme.colors.primary }}
          thumbColor={isDarkMode ? theme.colors.surface : theme.colors.surface}
        />
      </View>

      {/* Upgrade Section */}
      {isPremium ? (
        <Text style={{
          color: theme.colors.success,
          fontSize: 16,
          marginBottom: theme.spacing.lg,
        }}>
          🎉 You’re a Premium member!
        </Text>
      ) : (
        <TouchableOpacity
          onPress={handleUpgrade}
          style={{
            backgroundColor: theme.colors.accent,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            alignItems: 'center',
            marginBottom: theme.spacing.lg,
          }}
          disabled={loadingUpgrade}
        >
          {loadingUpgrade ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={{
              color: theme.colors.onPrimary,
              fontSize: 16,
              fontWeight: 'bold',
            }}>
              Remove Ads — Upgrade 🚀
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Sign Out */}
      <TouchableOpacity
        onPress={signOut}
        style={{
          marginTop: 'auto',
          paddingVertical: theme.spacing.sm,
          alignItems: 'center',
        }}
      >
        <Text style={{
          color: theme.colors.error,
          fontSize: 16,
          fontWeight: 'bold',
        }}>
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}
