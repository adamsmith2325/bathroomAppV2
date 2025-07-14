// src/screens/MapScreen.tsx
import * as Sentry from '@sentry/react-native';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize
} from 'react-native-google-mobile-ads';
import MapView, { Marker } from 'react-native-maps';
import { recordEvent } from '../lib/reviewManager';

import { ThemedText, ThemedView } from '../components/Themed';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/themeContext';
import { useSession } from '../lib/useSession';
import styles from './MapScreen.styles';

import BathroomDetailsModal, {
  Bathroom,
  CommentWithProfileRow,
} from '../components/BathroomDetailsModal';

export default function MapScreen() {
  const { user, isPremium } = useSession();
  const { theme } = useTheme();
  const { colors } = theme;

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [selectedBathroom, setSelectedBathroom] = useState<Bathroom | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [usageCount, setUsageCount] = useState(0);
  const [comments, setComments] = useState<CommentWithProfileRow[]>([]);
  const [newComment, setNewComment] = useState('');

  const [isFav, setIsFav] = useState(false);
  const { profile } = useSession();
  // 1) Get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need location access to show nearby bathrooms.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync();
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  // 2) Load all bathrooms
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('bathrooms').select('*');
      if (error) {
        console.error(error);
      } else {
        setBathrooms(data as Bathroom[]);
      }
    })();
  }, []);

  // 3) When a marker is pressed
  const handleMarkerPress = async (bathroom: Bathroom) => {
    setSelectedBathroom(bathroom);
    setModalVisible(true);
    await fetchUsageCount(bathroom.id);
    await fetchComments(bathroom.id);
    await fetchFavoriteStatus(bathroom.id);
    recordEvent('viewBathroom').catch(console.warn);
  };

  // 4) Fetch usage count
  const fetchUsageCount = async (bathroom_id: string) => {
    const { count, error } = await supabase
      .from('bathroom_usage')
      .select('*', { count: 'exact', head: true })
      .eq('bathroom_id', bathroom_id);
    if (!error && typeof count === 'number') {
      setUsageCount(count);
    }
  };

  // 5) Fetch comments + user profile (name & avatar)
  const fetchComments = async (bathroom_id: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        text,
        created_at,
        user_id,
        profile:profiles (
          name,
          avatar_url
        )
      `)
      .eq('bathroom_id', bathroom_id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setComments(data as CommentWithProfileRow[]);
    }
  };

  // 6) Favorite toggle
  const fetchFavoriteStatus = async (bathroom_id: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('bathroom_id', bathroom_id)
      .maybeSingle();
    if (!error) {
      setIsFav(!!data);
    }
  };
  const toggleFavorite = async () => {
    if (!user || !selectedBathroom) return;
    if (isFav) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('bathroom_id', selectedBathroom.id);
      setIsFav(false);
    } else {
      await supabase.from('favorites').insert({
        user_id: user.id,
        bathroom_id: selectedBathroom.id,
      });
      setIsFav(true);
    }
  };

  // 7) Mark as used
  const handleMarkUsed = async () => {
    if (!user || !selectedBathroom) return;
    await supabase.from('bathroom_usage').insert({
      bathroom_id: selectedBathroom.id,
      user_id: user.id,
    });
    await fetchUsageCount(selectedBathroom.id);
    recordEvent('markUsed').catch(console.warn);
    Alert.alert('👍', 'Thanks for marking this bathroom as used!');
  };

  // 8) Directions
  const handleGetDirections = () => {
    if (!selectedBathroom) return;
    const { lat, lng } = selectedBathroom as any; // make sure your Bathroom type has lat & lng
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${lat},${lng}`
        : `google.navigation:q=${lat},${lng}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open directions.'));
  };

  // 9) Submit a new comment
  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !selectedBathroom || !user) return;
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          bathroom_id: selectedBathroom.id,
          text: newComment.trim(),
          user_id: user.id,
        });
      if (error) throw error;
      setNewComment('');
      await fetchComments(selectedBathroom.id);
    } catch (err: any) {
      // log and surface
      console.error(err);
      Alert.alert('Error', err.message || 'Could not post comment.');
    }
  };

  // 10) Render loading / map
  if (!location) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={{ color: colors.textSecondary }}>
          Getting your location…
        </ThemedText>
      </ThemedView>
    );
  }

 

  return (
    <ThemedView style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {bathrooms.map((b) => (
          <Marker
            key={b.id}
            coordinate={{ latitude: (b as any).lat, longitude: (b as any).lng }}
            title={b.title}
            pinColor={colors.accent}
            onPress={() => handleMarkerPress(b)}
          />
        ))}

        {/* "You are here" */}
        <Marker
          coordinate={location}
          title="You are here"
          pinColor={colors.primary}
        />
      </MapView>
      {/* DETAILS MODAL */}
      {selectedBathroom && (
        <BathroomDetailsModal
          visible={modalVisible}
          bathroom={selectedBathroom}
          usageCount={usageCount}
          comments={comments}
          newComment={newComment}
          isPremium={isPremium}
          isFav={isFav}
          onMarkUsed={handleMarkUsed}
          onToggleFavorite={toggleFavorite}
          onGetDirections={handleGetDirections}
          onChangeComment={setNewComment}
          onSubmitComment={handleCommentSubmit}
          onClose={() => setModalVisible(false)}
        />
      )}
        {/*Ad Container */}
         {!profile?.is_premium && (
          <View style={styles.adContainer}>
            <BannerAd
              unitId={
                 TestIds.BANNER
                // Platform.OS === "ios"
                //   ? "ca-app-pub-5901242452853695/3188072947"
                //   : "ca-app-pub-5901242452853695/4501154615"
              }
              size={BannerAdSize.FULL_BANNER}
              onAdLoaded={() => Sentry.captureMessage("Banner Loaded")}
              onAdFailedToLoad={err => Sentry.captureMessage(err.message)}
            />
          </View>
      )}
    </ThemedView>
    
  );
}
