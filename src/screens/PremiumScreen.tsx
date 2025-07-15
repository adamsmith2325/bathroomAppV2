// src/screens/PremiumScreen.tsx
import { useNavigation } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import { ThemedText, ThemedView } from '../components/Themed';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/themeContext';
import { useSession } from '../lib/useSession';

// I‑A‑P helpers reused from lib/billing
import {
    Subscription,
    endConnection,
    finishTransaction,
    purchaseErrorListener,
    purchaseUpdatedListener,
} from 'react-native-iap';
import { fetchPlans, initIAP, purchasePremium } from '../lib/billing';

export default function PremiumScreen() {
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;
  const navigation = useNavigation();
  const { user } = useSession();

  /* ───────────────────────── IAP state ───────────────────────── */
  const [plans, setPlans] = useState<Subscription[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  /* ────────────────────── Init IAP once ──────────────────────── */
  useEffect(() => {
    let updSub: any = null;
    let errSub: any = null;

    (async () => {
      try {
        await initIAP();
        const subs = await fetchPlans();
        setPlans(subs);
      } catch (e) {
        Sentry.captureException(e);
      } finally {
        setPlansLoading(false);
      }

      updSub = purchaseUpdatedListener(async purchase => {
        try {
          await finishTransaction({ purchase, isConsumable: false });
          if (user) {
            await supabase
              .from('profiles')
              .update({ is_premium: true })
              .eq('id', user.id);
          }
          navigation.goBack();           // close paywall on success
        } catch (e) {
          Sentry.captureException(e);
        }
      });

      errSub = purchaseErrorListener(e => {
        Sentry.captureException(e);
        Alert.alert('Purchase failed', e.message);
      });
    })();

    return () => {
      updSub?.remove();
      errSub?.remove();
      endConnection();
    };
  }, [user, navigation]);

  /* ───────────────────── Trigger purchase ────────────────────── */
  const handlePurchase = useCallback(async (sku: string) => {
    try {
      setPurchaseLoading(true);
      await purchasePremium(sku);
    } catch (e: any) {
      Sentry.captureException(e);
      Alert.alert('Purchase Error', e.message ?? 'Unknown error');
      setPurchaseLoading(false);
    }
  }, []);

  /* ───────────────────────── UI ──────────────────────────────── */
  return (
    <ThemedView style={{ flex: 1, padding: spacing.lg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {/* ───────── Header / Value Prop ───────── */}
        <ThemedText
          style={{
            fontSize: typography.h1.fontSize,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: spacing.md,
          }}>
          Go Ad‑Free with LooLocator Premium
        </ThemedText>

        <ThemedText
          style={{ color: colors.text, lineHeight: 22, marginBottom: spacing.lg }}>
          • Removes banner ads{'\n'}
          • Unlocks advanced map filters{'\n'}
          • Saves unlimited favourite bathrooms{'\n'}
          • Supports future feature development 💙
        </ThemedText>

        {/* ───────── Legal links ───────── */}
        <TouchableOpacity onPress={() => Linking.openURL('https://yourdomain.com/privacy')}>
          <ThemedText style={{ color: colors.primary, marginBottom: 4 }}>
            Privacy Policy
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL(
              'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
            )
          }>
          <ThemedText style={{ color: colors.primary, marginBottom: spacing.lg }}>
            Terms of Use
          </ThemedText>
        </TouchableOpacity>

        {/* ───────── Purchase buttons ───────── */}
        {plansLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          plans.map(plan => (
            <TouchableOpacity
              key={plan.productId}
              onPress={() => handlePurchase(plan.productId)}
              disabled={purchaseLoading}
              style={{
                backgroundColor: colors.accent,
                padding: spacing.md,
                borderRadius: borderRadius.lg,
                alignItems: 'center',
                marginTop: spacing.md,
              }}>
              {purchaseLoading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <ThemedText
                  style={{ color: colors.onPrimary, fontSize: 16, fontWeight: 'bold' }}>
                  Go Ad-Free!
                </ThemedText>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}
