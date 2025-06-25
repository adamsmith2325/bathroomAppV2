import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TextInput, Button, FlatList, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../lib/themeContext';
import { supabase } from '../lib/supabase';
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
  const { user } = useSession();

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [selectedBathroom, setSelectedBathroom] = useState<Bathroom | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Get user location
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

  // Load bathrooms from Supabase
  useEffect(() => {
    const fetchBathrooms = async () => {
      const { data, error } = await supabase.from('bathrooms').select('*');
      if (error) {
        console.error('Error loading bathrooms:', error);
      } else {
        setBathrooms(data);
      }
    };

    fetchBathrooms();
  }, []);

  // Load comments for selected bathroom
  const fetchComments = async (bathroomId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('bathroom_id', bathroomId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading comments:', error);
    } else {
      setComments(data);
    }
  };

  // Handle marker press
  const handleMarkerPress = (bathroom: Bathroom) => {
    setSelectedBathroom(bathroom);
    setModalVisible(true);
    fetchComments(bathroom.id);
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !selectedBathroom) return;

    const { error } = await supabase.from('comments').insert({
      bathroom_id: selectedBathroom.id,
      user_id: user?.id,
      text: newComment.trim(),
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setNewComment('');
      fetchComments(selectedBathroom.id);
    }
  };

  const handleMarkUsed = () => {
    // Future: Insert into `bathroom_usage` or update analytics
    Alert.alert('Marked', 'You marked this bathroom as used!');
  };

  if (!location) return <Text style={{ flex: 1, textAlign: 'center', marginTop: 100 }}>Getting location…</Text>;

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
      </MapView>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }}>
          {selectedBathroom && (
            <>
              <Text style={{ color: theme.colors.text, fontSize: 20, marginBottom: 8 }}>
                🚻 {selectedBathroom.title}
              </Text>
              {selectedBathroom.entry_code ? (
                <Text style={{ color: theme.colors.textSecondary, marginBottom: 4 }}>
                  Code: {selectedBathroom.entry_code}
                </Text>
              ) : null}
              {selectedBathroom.instructions ? (
                <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
                  Instructions: {selectedBathroom.instructions}
                </Text>
              ) : null}

              <Button title="Mark as Used" onPress={handleMarkUsed} />

              <Text style={{ marginTop: 20, color: theme.colors.text, fontWeight: 'bold' }}>Comments</Text>

              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Text style={{ color: theme.colors.textSecondary, marginVertical: 4 }}>
                    • {item.text}
                  </Text>
                )}
                ListEmptyComponent={<Text style={{ color: theme.colors.textSecondary }}>No comments yet.</Text>}
                style={{ maxHeight: 200, marginVertical: 12 }}
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
              <View style={{ marginTop: 20 }}>
                <Button title="Close" onPress={() => setModalVisible(false)} color={theme.colors.error} />
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}
