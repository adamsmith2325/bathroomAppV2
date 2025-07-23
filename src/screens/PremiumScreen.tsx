import { useNavigation } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View
} from 'react-native';

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

import styles from './PremiumScreen.styles';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PremiumModal({ visible, onClose } : PremiumModalProps) {
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
    Sentry.captureMessage("Visible Status: " + visible);
    if (!visible) return;
    
    (async () => {
      try {
        await initIAP();
        const subs = await fetchPlans();
        Sentry.captureMessage(subs.toString());
        setPlans(subs);
      } catch (e) {
        Sentry.captureException(e);
      } finally {
        setPlansLoading(false);
        Sentry.captureMessage("Set Plans Loading False");
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
        Sentry.captureMessage("Set Purchase Loading False");
      }
    },
    []
  );

  return (
    <Modal
    visible={visible}
    animationType='slide'
    transparent={false}
    onRequestClose={onClose}
    >
                <View style={styles.container}>
                  <KeyboardAvoidingView
                    style={styles.keyboardAvoiding}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 0}
                  >
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText style={{ color: colors.onPrimary, fontWeight: 'bold' }}>
          Go Ad-Free with LooLocator Premium
        </ThemedText>

        <ThemedText style={{ color: colors.onPrimary }}>
          • Removes banner ads{'\n'}
          • Unlocks advanced map filters{'\n'}
          • Saves unlimited favourite bathrooms{'\n'}
          • Supports future feature development
        </ThemedText>

        <ThemedText style={{ color: colors.onPrimary }}>
        LooLocator Premium is only $1.99 monthly and you can cancel anytime
        </ThemedText>

        <TouchableOpacity onPress={() => Linking.openURL('http://freepublicbathrooms.com/privacy')}>
          <ThemedText style={{ color: colors.onPrimary, fontWeight: 'bold' }}>Privacy Policy</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            Linking.openURL(
              'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
            )
          }
        >
          <ThemedText style={{ color: colors.onPrimary, fontWeight: 'bold' }}>Terms of Use</ThemedText>
        </TouchableOpacity>

        {plansLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          plans.map(plan => (
            <TouchableOpacity
              key={plan.productId}
              style={styles.buttonContainer}
              onPress={() => handlePurchase(plan.productId)}
              disabled={purchaseLoading}
            >
              {purchaseLoading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <ThemedText style={{ color: colors.onPrimary, fontWeight: 'bold' }}>
                  Go Ad-Free!
                </ThemedText>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ThemedView>
    </KeyboardAvoidingView>
    </View>
    </Modal>
  );
}