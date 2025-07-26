// src/screens/PremiumScreen.tsx
import { useNavigation } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import * as Linking from 'expo-linking';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, TouchableOpacity } from 'react-native';

import { ThemedText, ThemedView } from '../components/Themed';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/themeContext';
import { useSession } from '../lib/useSession';

import {
  Subscription,
  endConnection,
  finishTransaction,
  purchaseErrorListener,
  purchaseUpdatedListener,
} from 'react-native-iap';
import { fetchPlans, initIAP, purchasePremium } from '../lib/billing';

interface PremiumModalProps {
  onClose: () => void;
}

export default function PremiumScreen({ onClose }: PremiumModalProps) {
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;
  const navigation = useNavigation();
  const { user } = useSession();

  const [plans, setPlans] = useState<Subscription[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {

    // 1) Kick off IAP init + plan fetch
    Sentry.captureMessage('IAP initialization start');
    initIAP()
      .then(() => {
        Sentry.captureMessage('IAP initialized');
        return fetchPlans();
      })
      .then(fetchedPlans => {
        setPlans(fetchedPlans);
        Sentry.captureMessage(`Fetched ${fetchedPlans.length} subscription plans`);
      })
      .catch(err => {
        Sentry.captureException(err);
        console.error('Failed to init or fetch plans', err);
        Alert.alert('Error', 'Could not load subscription plans.');
      })
      .finally(() => {
        setPlansLoading(false);
        Sentry.captureMessage('IAP setup done');
      });

    // 2) Listen for purchase updates
    const updSub = purchaseUpdatedListener(async purchase => {
      Sentry.captureMessage('purchaseUpdatedListener fired');
      try {
        await finishTransaction({ purchase, isConsumable: false });
        Sentry.captureMessage(`finishTransaction succeeded for ${purchase.productId}`);

        // mark user premium in Supabase
        if (user) {
          const { error } = await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', user.id);
          if (error) throw error;
        }

        // close the paywall
        navigation.goBack();
      } catch (e) {
        Sentry.captureException(e);
        Alert.alert('Error', 'Could not complete purchase.');
      }
    });

    // 3) Listen for purchase errors
    const errSub = purchaseErrorListener(e => {
      Sentry.captureException(e);
      Alert.alert('Purchase failed', e.message);
    });

    // 4) Cleanup
    return () => {
      updSub.remove();
      errSub.remove();
      endConnection();
    };
  }, [user, navigation]);

  const handlePurchase = useCallback(
    async (sku: string) => {
      setPurchaseLoading(true);
      Sentry.captureMessage(`requestSubscription for SKU: ${sku}`);
      try {
        await purchasePremium(sku);
        // actual state update & supabase write happen in the listener above
      } catch (err: any) {
        Sentry.captureException(err);
        Alert.alert('Purchase Error', err.message ?? 'Unknown error');
        setPurchaseLoading(false);
      }
    },
    []
  );

  // ───────── Loading State ─────────
  if (plansLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  // ───────── UI ─────────
  return (
    <ThemedView style={{ flex: 1, padding: spacing.lg, paddingTop: spacing.lg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {/* Header */}
        <ThemedText
          style={{
            fontSize: typography.header.fontSize * 1.5,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: spacing.md,
            marginTop: spacing.lg
          }}
        >
          Go Ad-Free with LooLocator Premium
        </ThemedText>

        {/* Benefits */}
        <ThemedText style={{ color: colors.text, lineHeight: 22, marginBottom: spacing.lg }}>
          For only $1.99 monthly:{'\n'}
          • Removes banner ads{'\n'}
          • Unlocks advanced map filters{'\n'}
          • Saves unlimited favorite bathrooms{'\n'}
          • Supports future feature development 💙
        </ThemedText>

        {/* Legal */}
        <TouchableOpacity onPress={() => Linking.openURL('https://freepublicbathrooms.com/privacy-policy')}>
          <ThemedText style={{ color: colors.primary, marginBottom: 4 }}>
            Privacy Policy
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://freepublicbathrooms.com/terms-of-service')}>
          <ThemedText style={{ color: colors.primary, marginBottom: spacing.lg }}>
            Terms of Use
          </ThemedText>
        </TouchableOpacity>

        {/* Purchase Buttons */}
        {plans.map(plan => (
          <TouchableOpacity
            key={plan.productId}
            onPress={() => handlePurchase(plan.productId)}
            disabled={purchaseLoading}
            style={{
              backgroundColor: colors.accent,
              padding: spacing.md,
              borderRadius: borderRadius.md,
              alignItems: 'center',
              marginTop: spacing.md,
            }}
          >
            {purchaseLoading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <ThemedText style={{ color: colors.onPrimary, fontWeight: 'bold' }}>
                Go Ad-Free!
              </ThemedText>
            )}
          </TouchableOpacity>
        ))}

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: colors.accent,
              padding: spacing.md,
              borderRadius: borderRadius.md,
              alignItems: 'center',
              marginTop: spacing.md,
            }}
          >
              <ThemedText style={{ color: colors.onPrimary }}>
                Close
              </ThemedText>
          </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}
