import { AdMobBanner } from 'expo-ads-admob';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/themeContext';
import { useSession } from '../lib/useSession';

interface Bathroom {
  id: string;
  title: string;
  entry_code?: string;
  instructions?: string;
  lat: number;
  lng: number;
}

interface Comment {
  id: string;
  text: string;
  user_id: string;
  created_at: string;
}

export default function MapScreen() {
  const { theme } = useTheme();
  const { user, isPremium } = useSession();

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [selectedBathroom, setSelectedBathroom] = useState<Bathroom | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [usageCount, setUsageCount] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need location access.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  useEffect(() => {
    const fetchBathrooms = async () => {
      const { data, error } = await supabase.from('bathrooms').select('*');
      if (!error && data) setBathrooms(data);
    };
    fetchBathrooms();
  }, []);

  const fetchComments = async (bathroomId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('bathroom_id', bathroomId)
      .order('created_at', { ascending: false });

    if (!error && data) setComments(data);
  };

  const fetchUsageCount = async (bathroomId: string) => {
    const { count, error } = await supabase
      .from('bathroom_usage')
      .select('*', { count: 'exact', head: true })
      .eq('bathroom_id', bathroomId);

    if (!error && typeof count === 'number') setUsageCount(count);
  };

  const handleMarkerPress = (bathroom: Bathroom) => {
    setSelectedBathroom(bathroom);
    setModalVisible(true);
    fetchComments(bathroom.id);
    fetchUsageCount(bathroom.id);
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !selectedBathroom) return;

    const { error } = await supabase.from('comments').insert({
      bathroom_id: selectedBathroom.id,
      user_id: user?.id,
      text: newComment.trim(),
    });

    if (!error) {
      setNewComment('');
      fetchComments(selectedBathroom.id);
    }
  };

  const handleMarkUsed = async () => {
    if (!selectedBathroom || !user) return;

    const { error } = await supabase.from('bathroom_usage').insert({
      bathroom_id: selectedBathroom.id,
      user_id: user.id,
    });

    if (!error) {
      fetchUsageCount(selectedBathroom.id);
      Alert.alert('👍', 'Thanks for marking this bathroom as used!');
    }
  };

  const handleGetDirections = () => {
    if (!selectedBathroom) return;
    const { lat, lng } = selectedBathroom;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
    });

    if (url) {
      Linking.openURL(url).catch(() =>
        Alert.alert('Error', 'Unable to open directions.')
      );
    }
  };

  if (!location) {
    return <Text style={{ flex: 1, textAlign: 'center', marginTop: 100 }}>Getting location…</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
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
            coordinate={{ latitude: b.lat, longitude: b.lng }}
            title={b.title}
            onPress={() => handleMarkerPress(b)}
          />
        ))}
        <Marker coordinate={location} title="You are here" pinColor="blue" />
      </MapView>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 20 }}>
          {selectedBathroom && (
            <>
              <View style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 8,
                marginBottom: 20,
              }}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.colors.text }}>
                  🚻 {selectedBathroom.title}
                </Text>

                {selectedBathroom.entry_code && (
                  <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
                    🔐 Code: {selectedBathroom.entry_code}
                  </Text>
                )}

                {selectedBathroom.instructions && (
                  <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
                    📝 Instructions: {selectedBathroom.instructions}
                  </Text>
                )}

                <Text style={{ marginTop: 12, fontSize: 16, color: theme.colors.primary }}>
                  🚶 Used {usageCount} {usageCount === 1 ? 'time' : 'times'}
                </Text>

                <View style={{ marginTop: 12 }}>
                  <Button title="👍 Mark as Used" onPress={handleMarkUsed} />
                </View>

                <View style={{ marginTop: 12 }}>
                  <Button title="🧭 Get Directions" onPress={handleGetDirections} />
                </View>
              </View>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: 6 }}>
                💬 Comments
              </Text>

              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Text style={{ color: theme.colors.textSecondary, marginVertical: 4 }}>
                    • {item.text}
                  </Text>
                )}
                ListEmptyComponent={<Text style={{ color: theme.colors.textSecondary }}>No comments yet.</Text>}
                style={{ maxHeight: 200, marginBottom: 16 }}
              />

              <TextInput
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
                placeholderTextColor={theme.colors.textSecondary}
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              />
              <Button title="Submit Comment" onPress={handleCommentSubmit} />
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 20 }}>
                <Text style={{
                  textAlign: 'center',
                  color: theme.colors.error,
                  fontWeight: 'bold',
                  fontSize: 16,
                }}>
                  Close
                </Text>
              </TouchableOpacity>

              {/* ✅ Show ad only for free users */}
              {!isPremium && (
                <View style={{ marginTop: 24 }}>
                  <AdMobBanner
                    bannerSize="smartBannerPortrait"
                    adUnitID={
                      Platform.OS === 'ios'
                        ? 'ca-app-pub-5901242452853695/3188072947' // ← replace with your real iOS ID
                        : 'ca-app-pub-5901242452853695/4501154615' // ← replace with your real Android ID
                    }
                    servePersonalizedAds
                    onDidFailToReceiveAdWithError={(err) =>
                      console.log('Ad error', err)
                    }
                  />
                </View>
              )}
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}
