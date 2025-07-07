import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as InAppPurchases from 'expo-in-app-purchases';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
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

  // local copy of profile so we can edit fields
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

  // loading states for each action
  const [uploading, setUploading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingRadius, setSavingRadius] = useState(false);

  const radiusOptions = [0, 250, 500, 1000, 2000, 5000];

  /* ---------- Avatar picker & upload ---------- */
  const pickAvatar = async () => {
    if (!user) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission required', 'You need to allow photo access.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const ext = uri.split('.').pop()!;
      const filename = `${user.id}.${ext}`;

      const { error: uploadErr } = await supabase
        .storage
        .from('avatars')
        .upload(filename, blob, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filename);

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);
      if (updateErr) throw updateErr;

      setLocalProfile((p: LocalProfile | null) =>
        p ? { ...p, avatar_url: urlData.publicUrl } : p
      );
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  /* ---------- Save name ---------- */
  const handleSaveName = async () => {
    if (!user || !localProfile) return;
    setSavingName(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({ name: localProfile.name })
      .eq('id', user.id)
      .select()
      .single();
    if (error) {
      Alert.alert('Error', error.message);
    } else if (data) {
      setLocalProfile((p: LocalProfile | null) =>
        p ? { ...p, name: data.name } : p
      );
    }
    setSavingName(false);
  };

  /* ---------- Save radius ---------- */
  const handleSaveRadius = async () => {
    if (!user || !localProfile) return;
    setSavingRadius(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({ notify_radius: localProfile.notifyRadius })
      .eq('id', user.id)
      .select()
      .single();
    if (error) {
      Alert.alert('Error', error.message);
    } else if (data) {
      setLocalProfile((p: LocalProfile | null) =>
        p ? { ...p, notifyRadius: data.notify_radius } : p
      );
    }
    setSavingRadius(false);
  };

  /* ---------- In-App Purchase Logic ---------- */
  const productIds = ['YOUR_PRODUCT_ID']; // ← replace with your App Store / Play IDs
  const [products, setProducts] = useState<InAppPurchases.IAPItemDetails[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    let purchaseListener: any;

    async function initIAP() {
      setSubsLoading(true);
      await InAppPurchases.connectAsync();

      // fetch your configured products
      const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        setProducts(results ?? []);
      }

      // check restore history once
      const historyResponse = await InAppPurchases.getPurchaseHistoryAsync();
      const pastPurchases = historyResponse.results ?? [];
      const found = pastPurchases.some(
        (h) => productIds.includes(h.productId) && h.acknowledged
      );
      setIsSubscribed(found);
      setSubsLoading(false);

      // set up listener for new purchases
      purchaseListener = InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }) => {
        if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
          for (const purchase of results) {
            if (!purchase.acknowledged) {
              await InAppPurchases.finishTransactionAsync(purchase, false);
            }
            setIsSubscribed(true);
          }
        } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
          // user cancelled
        } else {
          console.error('IAP error code', errorCode);
        }
      });
    }

    initIAP();

    return () => {
      InAppPurchases.disconnectAsync();
    };
  }, []);

  const purchase = async (productId: string) => {
    setSubsLoading(true);
    await InAppPurchases.purchaseItemAsync(productId);
    // listener will update isSubscribed
    setSubsLoading(false);
  };

  const restore = async () => {
    setSubsLoading(true);
    const historyResponse = await InAppPurchases.getPurchaseHistoryAsync();
    const pastPurchases = historyResponse.results ?? [];
    const found = pastPurchases.some(
      (h) => productIds.includes(h.productId) && h.acknowledged
    );
    setIsSubscribed(found);
    setSubsLoading(false);
  };

  /* ---------- Render loading state ---------- */
  if (sessLoading || !localProfile) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  /* ---------- Inline text styles ---------- */
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
    <ThemedView style={styles.container}>
      {/* Avatar */}
      <TouchableOpacity onPress={pickAvatar} disabled={uploading}>
        {localProfile.avatar_url ? (
          <Image
            source={{ uri: localProfile.avatar_url }}
            style={[
              styles.avatarBase,
              {
                width: spacing.md * 4,
                height: spacing.md * 4,
                borderRadius: spacing.md * 2,
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: colors.surface },
            ]}
          />
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
          style={[
            styles.inputBase,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
              borderRadius: borderRadius.md,
              padding: spacing.sm,
              flex: 1,
              marginLeft: spacing.sm,
            },
          ]}
          value={localProfile.name}
          onChangeText={(text) =>
            setLocalProfile((p: LocalProfile | null) =>
              p ? { ...p, name: text } : p
            )
          }
        />
      </View>
      <Button
        title="Save Name"
        color={colors.primary}
        onPress={handleSaveName}
        disabled={savingName}
      />

      {/* Radius Picker */}
      <View style={styles.field}>
        <ThemedText style={labelTextStyle}>Notify Radius</ThemedText>
        <View
          style={{
            flex: 1,
            marginLeft: spacing.sm,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: borderRadius.md,
          }}
        >
          <Picker
            selectedValue={localProfile.notifyRadius}
            onValueChange={(val) =>
              setLocalProfile((p: LocalProfile | null) =>
                p ? { ...p, notifyRadius: val } : p
              )
            }
            dropdownIconColor={colors.textSecondary}
            style={{ color: colors.text }}
          >
            {radiusOptions.map((r) => (
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
        {subsLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : isSubscribed ? (
          <ThemedText
            style={[labelTextStyle, { color: colors.success, marginTop: spacing.sm }]}
          >
            You’re Premium 🎉
          </ThemedText>
        ) : (
          products.map((prod) => (
            <Button
              key={prod.productId}
              title={`Subscribe (${prod.price})`}
              color={colors.accent}
              onPress={() => purchase(prod.productId)}
            />
          ))
        )}

        {!subsLoading && !isSubscribed && (
          <Button
            title="Restore Purchases"
            color={colors.accent}
            onPress={restore}
          />
        )}
      </View>

      {/* Sign Out */}
      <View style={{ marginTop: spacing.lg }}>
        <Button title="Sign Out" color={colors.error} onPress={signOut} />
      </View>
    </ThemedView>
  );
}
