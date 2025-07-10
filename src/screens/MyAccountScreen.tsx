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
  const { user, profile, isPremium, isLoading: sessLoading, signOut } = useSession();

  // Editable local copy of the profile
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

  // Loading states
  const [uploading, setUploading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingRadius, setSavingRadius] = useState(false);

  // In-app purchase state
  const [plans, setPlans] = useState<Subscription[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Radius options
  const radiusOptions = [0, 250, 500, 1000, 2000, 5000];

  /* ---------- Avatar picker & upload ---------- */
const pickAvatar = async () => {
  if (!user) return;

  // 1) ask permission & pick
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required', 'You need to allow photo access.');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,            // bump quality if you want
    base64: false,
  });
  if (result.canceled) return;

  try {
    setUploading(true);
    const uri = result.assets[0].uri;

    // 2) fetch as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // sanity‐check
    if (blob.size === 0) {
      throw new Error('Picked image is empty.');
    }

    // derive an extension and mime
    const mime = blob.type;                    // e.g. 'image/jpeg'
    const ext  = mime.split('/')[1];           // e.g. 'jpeg'
    const filename = `${user.id}.${ext}`;

    // 3) upload with contentType
    const { error: uploadErr } = await supabase
      .storage
      .from('avatars')
      .upload(filename, blob, {
        upsert: true,
        contentType: mime,
      });

    if (uploadErr) throw uploadErr;

    // 4) grab the public URL and write to your profile row
    const { data: urlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(filename);

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id);

    if (updateErr) throw updateErr;

    // 5) update local state so your UI re-renders immediately
    setLocalProfile(p => p ? { ...p, avatar_url: urlData.publicUrl } : p);

  } catch (e: any) {
    console.error('Avatar upload error:', e);
    Alert.alert('Upload failed', e.message);
  } finally {
    setUploading(false);
  }
};

  /* ---------- Save name ---------- */
  const handleSaveName = async () => {
    Sentry.captureMessage('Save name start');
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
      Sentry.captureMessage('Name saved successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message);
      Sentry.captureException(e);
    } finally {
      setSavingName(false);
    }
  };

  /* ---------- Save radius ---------- */
  const handleSaveRadius = async () => {
    Sentry.captureMessage('Save radius start');
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
      Sentry.captureMessage('Radius saved successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message);
      Sentry.captureException(e);
    } finally {
      setSavingRadius(false);
    }
  };

  /* ---------- In-App Purchase setup & listeners ---------- */
  useEffect(() => {
    let updateSub: any = null;
    let errorSub: any = null;

    (async () => {
      Sentry.captureMessage('IAP initialization start');
      try {
        await initIAP();
        Sentry.captureMessage('IAP initialized');
        const subs = await fetchPlans();
        setPlans(subs);
        Sentry.captureMessage(`Fetched ${subs.length} subscription plans`);
      } catch (e) {
        console.error('Failed to init or fetch plans', e);
        Sentry.captureException(e);
      } finally {
        setPlansLoading(false);
        Sentry.captureMessage('IAP initialization end');
      }

      updateSub = purchaseUpdatedListener(async purchase => {
        Sentry.captureMessage('purchaseUpdatedListener fired');
        try {
          await finishTransaction({ purchase, isConsumable: false });
          Sentry.captureMessage(`finishTransaction succeeded for ${purchase.productId}`);
        } catch (ackErr) {
          Sentry.captureException(ackErr);
        }
      });

      errorSub = purchaseErrorListener(err => {
        Sentry.captureMessage('purchaseErrorListener fired');
        Sentry.captureException(err);
        Alert.alert('Purchase failed', err.message);
      });
    })();

    return () => {
      updateSub?.remove();
      errorSub?.remove();
      endConnection();
    };
  }, []);

  /* trigger a purchase */
  const handlePurchase = useCallback(async (sku: string) => {
    Sentry.captureMessage(`requestSubscription for SKU: ${sku}`);
    setPurchaseLoading(true);
    try {
      await purchasePremium(sku);
    } catch (err: any) {
      Alert.alert('Purchase Error', err.message);
      Sentry.captureException(err);
    } finally {
      setPurchaseLoading(false);
    }
  }, []);

  /* ---------- Render loading state ---------- */
  if (sessLoading || !localProfile) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  /* ---------- Text Styles ---------- */
  const headerTextStyle: TextStyle = {
    fontSize: typography.header.fontSize,
    fontWeight: typography.header.fontWeight as TextStyle['fontWeight'],
    color: colors.text,
    marginBottom: spacing.lg,
  };
  const labelTextStyle: TextStyle = {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight as TextStyle['fontWeight'],
    color: colors.text,
  };

  return (
    <KeyboardAvoidingView>
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
      <ThemedText style={[styles.headerBase, headerTextStyle]}>
        My Account
      </ThemedText>

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
          onChangeText={text => setLocalProfile(p => p ? { ...p, name: text } : p)}
        />
      </View>
      <Button title="Save Name" color={colors.primary} onPress={handleSaveName} disabled={savingName} />

      {/* Radius Picker */}
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
            onValueChange={val => setLocalProfile(p => p ? { ...p, notifyRadius: val } : p)}
            dropdownIconColor={colors.text}
            style={{ color: colors.text }}
          >
            {radiusOptions.map(r => (
              <Picker.Item key={r} value={r} label={r === 0 ? 'Off' : `${r} ft`} />
            ))}
          </Picker>
        </View>
      </View>
      <Button title="Save Radius" color={colors.primary} onPress={handleSaveRadius} disabled={savingRadius} />

      {/* Membership */}
      <View style={styles.field}>
        <ThemedText style={labelTextStyle}>Membership</ThemedText>
        {plansLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : isPremium ? (
          <ThemedText style={[labelTextStyle, { color: colors.success, marginTop: spacing.sm }]}>
            🎉 You’re Premium!
          </ThemedText>
        ) : (
          plans.map(plan => (
            <TouchableOpacity
              key={plan.productId}
              onPress={() => handlePurchase(plan.productId)}
              disabled={purchaseLoading}
              style={{
                backgroundColor: colors.accent,
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                alignItems: 'center',
                marginTop: spacing.sm,
              }}
            >
              {purchaseLoading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <ThemedText style={{ color: colors.onPrimary, fontWeight: 'bold' }}>
                  Go Ad-Free
                </ThemedText>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Sign Out */}
      <View style={{ marginTop: spacing.lg }}>
        <Button title="Sign Out" color={colors.error} onPress={signOut} />
      </View>
    </ThemedView>
    </KeyboardAvoidingView>
  );
}
