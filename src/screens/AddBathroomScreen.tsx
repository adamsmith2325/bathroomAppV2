// src/screens/AddBathroomScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, TextInput, Alert, Button, KeyboardAvoidingView, Platform } from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSession } from '../lib/useSession';
import { useTheme } from '../lib/themeContext';
import { supabase } from '../lib/supabase';

export default function AddBathroomScreen() {
  const { theme } = useTheme();
  const { user } = useSession();

  const [markerCoords, setMarkerCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [title, setTitle] = useState('');
  const [entryCode, setEntryCode] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setMarkerCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const handleSubmit = async () => {
    if (!markerCoords || !title.trim()) {
      Alert.alert('Missing Info', 'Please drop a pin and enter a title.');
      return;
    }

    const { error } = await supabase.from('bathrooms').insert({
      user_id: user?.id,
      title,
      entry_code: entryCode || null,
      instructions: instructions || null,
      lat: markerCoords.latitude,
      lng: markerCoords.longitude,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Bathroom added!');
      setTitle('');
      setEntryCode('');
      setInstructions('');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {markerCoords && (
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              ...markerCoords,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={(e: MapPressEvent) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setMarkerCoords({ latitude, longitude });
            }}
          >
            <Marker
              draggable
              coordinate={markerCoords}
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setMarkerCoords({ latitude, longitude });
              }}
            />
          </MapView>
        )}

        <View style={{ padding: 16 }}>
          <TextInput
            placeholder="Bathroom Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={theme.colors.textSecondary}
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              color: theme.colors.text,
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
            }}
          />

          <TextInput
            placeholder="Entry Code (optional)"
            value={entryCode}
            onChangeText={setEntryCode}
            placeholderTextColor={theme.colors.textSecondary}
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              color: theme.colors.text,
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
            }}
          />

          <TextInput
            placeholder="Entry Instructions"
            value={instructions}
            onChangeText={setInstructions}
            multiline
            placeholderTextColor={theme.colors.textSecondary}
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              color: theme.colors.text,
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              height: 80,
              textAlignVertical: 'top',
            }}
          />

          <Button title="Submit Bathroom" onPress={handleSubmit} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
