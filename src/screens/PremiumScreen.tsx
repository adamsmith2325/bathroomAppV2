import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';

import { ThemedView, ThemedText } from '../components/Themed';
import { useTheme } from '../lib/themeContext';
import { useSession } from '../lib/useSession';
import { supabase } from '../lib/supabase';

import {
  Subscription,
  endConnection,
  finishTransaction,
  purchaseErrorListener,
  purchaseUpdatedListener,
} from 'react-native-iap';
import { fetchPlans, initIAP, purchasePremium } from '../lib/billing';

import styles from './PremiumScreen.styles';

export default function PremiumScreen() {
  const { theme } = useTheme();
  const { colors } = theme;
  const navigation = useNavigation();
  const { user } = useSession();

  const [plans, setPlans] = useState<Subscription[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {
    let updateSub: any = null;
    let errorSub: any = null;

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

      updateSub = purchaseUpdatedListener(async purchase => {
        try {
          await finishTransaction({ purchase, isConsumable: false });
          if (user) {
            await supabase
              .from('profiles')
              .update({ is_premium: true })
              .eq('id', user.id);
          }
          navigation.goBack(); // Close the paywall on success
        } catch (err) {
          Sentry.captureException(err);
        }
      });

      errorSub = purchaseErrorListener(err => {
        Sentry.captureException(err);
        Alert.alert('Purchase failed', err.message);
      });
    })();

    return () => {
      updateSub?.remove();
      errorSub?.remove();
      endConnection();
    };
  }, [user, navigation]);

  const handlePurchase = useCallback(
    async (sku: string) => {
      setPurchaseLoading(true);
      try {
        await purchasePremium(sku);
      } catch (err: any) {
        Sentry.captureException(err);
        Alert.alert('Purchase Error', err.message ?? 'Unknown error');
      } finally {
        setPurchaseLoading(false);
      }
    },
    []
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText style={styles.header}>
          Go Ad-Free with LooLocator Premium
        </ThemedText>

        <ThemedText style={styles.description}>
          • Removes banner ads{'\n'}
          • Unlocks advanced map filters{'\n'}
          • Saves unlimited favourite bathrooms{'\n'}
          • Supports future feature development 💙
        </ThemedText>

        <TouchableOpacity onPress={() => Linking.openURL('https://yourdomain.com/privacy')}>
          <ThemedText style={styles.link}>Privacy Policy</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            Linking.openURL(
              'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
            )
          }
        >
          <ThemedText style={styles.linkLast}>Terms of Use</ThemedText>
        </TouchableOpacity>

        {plansLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          plans.map(plan => (
            <TouchableOpacity
              key={plan.productId}
              style={styles.planButton}
              onPress={() => handlePurchase(plan.productId)}
              disabled={purchaseLoading}
            >
              {purchaseLoading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <ThemedText style={styles.planButtonText}>
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