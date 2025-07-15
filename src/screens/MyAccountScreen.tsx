// src/screens/MyAccountScreen.tsx

import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText, ThemedView } from '../components/Themed';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/themeContext';
import { useSession } from '../lib/useSession';
import styles from './MyAccountScreen.styles';

// Sentry for logging
import * as Sentry from '@sentry/react-native';

// react-native-iap imports
import {
  Subscription,
  endConnection,
  finishTransaction,
  purchaseErrorListener,
  purchaseUpdatedListener,
} from 'react-native-iap';
import { fetchPlans, initIAP, purchasePremium } from '../lib/billing';
import PremiumModal from './PremiumScreen';

interface LocalProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  notifyRadius: number;
  is_premium: boolean;
}

export function MyAccountScreen() {
  const { theme, mode, toggleTheme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;
  const { user, profile, isLoading: sessLoading, signOut } = useSession();

  // ——————————————————————————
  // 1) Keep a local editable copy of your Supabase profile
  // ——————————————————————————
  const [localProfile, setLocalProfile] = useState<LocalProfile | null>(null);
  useEffect(() => {
    if (profile && !localProfile) {
      setLocalProfile({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.avatar_url,
        notifyRadius: profile.notifyRadius,
        is_premium: profile.is_premium,
      });
    }
  }, [profile]);

  // ——————————————————————————
  // 2) UI / loading state
  // ——————————————————————————
  const [uploading, setUploading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingRadius, setSavingRadius] = useState(false);

  // ——————————————————————————
  // 3) In-App Purchase state
  // ——————————————————————————
  const [plans, setPlans] = useState<Subscription[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const radiusOptions = [0, 250, 500, 1000, 2000, 5000];

  // ——————————————————————————
  // 4) Avatar picker & upload
  // ——————————————————————————
  const pickAvatar = async () => {
    if (!user) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission required', 'You need to allow photo access.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;

    try {
      setUploading(true);
      const uri = result.assets[0].uri;
      const resp = await fetch(uri);
      const blob = await resp.blob();
      if (blob.size === 0) throw new Error('Empty file');

      const ext = blob.type.split('/')[1];
      const filename = `${user.id}.${ext}`;
      await supabase
        .storage
        .from('avatars')
        .upload(filename, blob, { upsert: true, contentType: blob.type });

      const { data: urlData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filename);

      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);
      if (updErr) throw updErr;

      setLocalProfile(p => p ? { ...p, avatar_url: urlData.publicUrl } : p);
    } catch (e: any) {
      Sentry.captureException(e);
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  // ——————————————————————————
  // 5) Save name
  // ——————————————————————————
  const handleSaveName = async () => {
    if (!user || !localProfile) return;
    setSavingName(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ name: localProfile.name })
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      setLocalProfile(p => p ? { ...p, name: data.name } : p);
    } catch (e: any) {
      Sentry.captureException(e);
      Alert.alert('Error', e.message);
    } finally {
      setSavingName(false);
    }
  };

  // ——————————————————————————
  // 6) Save radius
  // ——————————————————————————
  const handleSaveRadius = async () => {
    if (!user || !localProfile) return;
    setSavingRadius(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ notify_radius: localProfile.notifyRadius })
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      setLocalProfile(p => p ? { ...p, notifyRadius: data.notify_radius } : p);
    } catch (e: any) {
      Sentry.captureException(e);
      Alert.alert('Error', e.message);
    } finally {
      setSavingRadius(false);
    }
  };

  // ——————————————————————————
  // 7) IAP init + listeners
  // ——————————————————————————
  useEffect(() => {
    let updateSub: any = null;
    let errorSub: any = null;

    (async () => {
      Sentry.captureMessage('IAP initialization start');
      try {
        await initIAP();
        const subs = await fetchPlans();
        setPlans(subs);
      } catch (e: any) {
        Sentry.captureException(e);
      } finally {
        setPlansLoading(false);
      }

      updateSub = purchaseUpdatedListener(async (purchase) => {
        try {
          await finishTransaction({ purchase, isConsumable: false });
          // ✅ update Supabase
          if (user) {
            const { error: supaErr } = await supabase
              .from('profiles')
              .update({ is_premium: true })
              .eq('id', user.id);
            if (supaErr) Sentry.captureException(supaErr);
          }
          // ✅ update local state
          setLocalProfile(p => p ? { ...p, is_premium: true } : p);
        } catch (ackErr: any) {
          Sentry.captureException(ackErr);
        }
      });

      errorSub = purchaseErrorListener((err) => {
        Sentry.captureException(err);
        Alert.alert('Purchase failed', err.message);
      });
    })();

    return () => {
      updateSub?.remove();
      errorSub?.remove();
      endConnection();
    };
  }, [user]);

  // ——————————————————————————
  // 8) Manual purchase button
  // ——————————————————————————
  const [ showPremium, setShowPremium ] = useState(false);
  const handlePurchase = useCallback(
    async (sku: string) => {
      setPurchaseLoading(true);
      try {
        await purchasePremium(sku);
        // after the SDK resolves, also update Supabase & state:
        if (user) {
          const { error: supaErr } = await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', user.id);
          if (supaErr) throw supaErr;
        }
        setLocalProfile(p => p ? { ...p, is_premium: true } : p);
      } catch (err: any) {
        Sentry.captureException(err);
        Alert.alert('Purchase Error', err.message ?? 'Unknown error');
      } finally {
        setPurchaseLoading(false);
      }
    },
    [user]
  );

  // ——————————————————————————
  // 9) If still loading…
  // ——————————————————————————
  if (sessLoading || !localProfile) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  // ——————————————————————————
  // 10) Inline text styles
  // ——————————————————————————
  const headerTextStyle: TextStyle = {
    fontSize: typography.header.fontSize,
    fontWeight: typography.header.fontWeight as any,
    color: colors.text,
    marginBottom: spacing.lg,
  };
  const labelTextStyle: TextStyle = {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight as any,
    color: colors.text,
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.container}>
          {/* Avatar */}
          <TouchableOpacity onPress={pickAvatar} disabled={uploading}>
            {localProfile.avatar_url ? (
              <Image
                source={{ uri: localProfile.avatar_url }}
                style={[styles.avatarBase, {
                  width: spacing.md * 4,
                  height: spacing.md * 4,
                  borderRadius: spacing.md * 2,
                }]}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]} />
            )}
          </TouchableOpacity>

          {/* Header */}
          <ThemedText style={[styles.headerBase, headerTextStyle]}>My Account</ThemedText>

          {/* Dark Mode */}
          <View style={styles.field}>
            <ThemedText style={labelTextStyle}>Dark Mode</ThemedText>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={mode === 'dark' ? colors.onPrimary : colors.surface}
            />
          </View>

          {/* Name */}
          <View style={styles.field}>
            <ThemedText style={labelTextStyle}>Name</ThemedText>
            <TextInput
              style={[styles.inputBase, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
                flex: 1,
                marginLeft: spacing.sm,
              }]}
              value={localProfile.name}
              onChangeText={text =>
                setLocalProfile(p => p ? { ...p, name: text } : p)
              }
            />
          </View>
          <Button
            title="Save Name"
            color={colors.primary}
            onPress={handleSaveName}
            disabled={savingName}
          />

          {/* Radius */}
          <View style={styles.field}>
            <ThemedText style={labelTextStyle}>Notify Radius</ThemedText>
            <View style={{
              flex: 1,
              marginLeft: spacing.sm,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: borderRadius.md,
            }}>
              <Picker
                selectedValue={localProfile.notifyRadius}
                itemStyle={{ color: colors.text }}
                onValueChange={val =>
                  setLocalProfile(p => p ? { ...p, notifyRadius: val } : p)
                }
                dropdownIconColor={colors.text}
                style={{ color: colors.text }}
              >
                {radiusOptions.map(r => (
                  <Picker.Item
                    key={r}
                    value={r}
                    label={r === 0 ? 'Off' : `${r} ft`}
                  />
                ))}
              </Picker>
            </View>
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
          {localProfile.is_premium ? (
            <ThemedText
              style={[labelTextStyle, { color: colors.success, marginTop: spacing.sm }]}>
              🎉 You’re Premium!
            </ThemedText>
          ) : (
            <TouchableOpacity
              onPress={() => setShowPremium(true)}
              style={{
                backgroundColor: colors.accent,
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                alignItems: 'center',
                marginTop: spacing.sm,
              }}>
              <ThemedText style={{ color: colors.onPrimary, fontWeight: 'bold' }}>
                View Premium Options
              </ThemedText>
              <PremiumModal
              visible={showPremium}
              onClose={() => setShowPremium(false)}
              />
            </TouchableOpacity>
          )}
        </View>


          {/* Sign Out */}
          <View style={{ marginTop: spacing.lg }}>
            <Button title="Sign Out" color={colors.error} onPress={signOut} />
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
