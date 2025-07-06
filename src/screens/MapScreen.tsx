// import {
//   BannerAd,
//   BannerAdSize,
//   TestIds,
// } from 'react-native-google-mobile-ads';
// src/screens/MapScreen.tsx
import { Ionicons } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import * as Location from 'expo-location'
import React, { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  FlatList,
  Modal,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { ThemedText, ThemedView } from '../components/Themed'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/themeContext'
import { useSession } from '../lib/useSession'
import styles from './MapScreen.styles'

interface Bathroom {
  id: string
  title: string
  entry_code?: string
  instructions?: string
  lat: number
  lng: number
}

interface Comment {
  id: string
  text: string
  user_id: string
  created_at: string
}

export default function MapScreen() {
  const { theme } = useTheme()
  const { user, isPremium } = useSession()
  const { colors, spacing, borderRadius, typography } = theme

  // Prepare dynamic text styles
  const headerStyle = styles.headerText(
    typography.header.fontSize,
    typography.header.fontWeight as any,
    colors.text
  )
  const bodyStyle = styles.subText(
    typography.body.fontSize,
    typography.body.fontWeight as any,
    colors.text
  )
  const secondaryStyle = styles.subText(
    typography.body.fontSize,
    typography.body.fontWeight as any,
    colors.textSecondary,
    spacing.sm
  )
  const commentStyle = styles.commentText(
    typography.body.fontSize,
    typography.body.fontWeight as any,
    colors.textSecondary
  )
  const inputStyle = styles.commentInput(colors.border, colors.text)
  const closeStyle = styles.closeText(
    typography.body.fontSize,
    typography.body.fontWeight as any,
    colors.error
  )

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([])
  const [selectedBathroom, setSelectedBathroom] = useState<Bathroom | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [usageCount, setUsageCount] = useState(0)

  // Favorites state
  const [isFav, setIsFav] = useState(false)

  // Get user location
  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need location access.')
        return
      }
      const loc = await Location.getCurrentPositionAsync({})
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      })
    })()
  }, [])

  // Load bathrooms
  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.from('bathrooms').select('*')
      if (!error && data) {
        setBathrooms(data as Bathroom[])
      }
    })()
  }, [])

  // Comments & usage fetchers
  const fetchComments = async (id: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('bathroom_id', id)
      .order('created_at', { ascending: false })
    if (!error && data) {
      setComments(data as Comment[])
    }
  }
  const fetchUsageCount = async (id: string) => {
    const { count, error } = await supabase
      .from('bathroom_usage')
      .select('*', { count: 'exact', head: true })
      .eq('bathroom_id', id)
    if (!error && typeof count === 'number') {
      setUsageCount(count)
    }
  }

  // Check favorite status whenever modal opens
  useEffect(() => {
    if (!user || !selectedBathroom) return
    ;(async () => {
      const { data } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('bathroom_id', selectedBathroom.id)
        .single()
      setIsFav(!!data)
    })()
  }, [user, selectedBathroom])

  // Handlers
  const handleMarkerPress = (b: Bathroom) => {
    setSelectedBathroom(b)
    setModalVisible(true)
    fetchComments(b.id)
    fetchUsageCount(b.id)
  }
  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !selectedBathroom) return
    const { error } = await supabase.from('comments').insert({
      bathroom_id: selectedBathroom.id,
      user_id: user?.id,
      text: newComment.trim(),
    })
    if (!error) {
      setNewComment('')
      fetchComments(selectedBathroom.id)
    }
  }
  const handleMarkUsed = async () => {
    if (!selectedBathroom || !user) return
    const { error } = await supabase.from('bathroom_usage').insert({
      bathroom_id: selectedBathroom.id,
      user_id: user.id,
    })
    if (!error) {
      fetchUsageCount(selectedBathroom.id)
      Alert.alert('👍', 'Thanks for marking this bathroom as used!')
    }
  }
  const handleGetDirections = () => {
    if (!selectedBathroom) return
    const { lat, lng } = selectedBathroom
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
    })
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open directions.'))
    }
  }

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!user || !selectedBathroom) return
    if (isFav) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('bathroom_id', selectedBathroom.id)
      setIsFav(false)
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: user.id, bathroom_id: selectedBathroom.id })
      setIsFav(true)
    }
  }

  // Loading
  if (!location) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={[styles.loadingText, secondaryStyle]}>
          Getting location…
        </ThemedText>
      </ThemedView>
    )
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
            coordinate={{ latitude: b.lat, longitude: b.lng }}
            title={b.title}
            pinColor={colors.accent}
            onPress={() => handleMarkerPress(b)}
          />
        ))}
        <Marker coordinate={location} title="You are here" pinColor={colors.primary} />
      </MapView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <ThemedView
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
        >
          <ThemedView
            style={[styles.modalContainer(spacing.md), { backgroundColor: colors.background }]}
          >
            {selectedBathroom && (
              <>
                <ThemedView
                  style={[styles.card(borderRadius.md, spacing.md), { backgroundColor: colors.surface }]}
                >
                  <ThemedText style={headerStyle}>
                    🚻 {selectedBathroom.title}
                  </ThemedText>

                  {selectedBathroom.entry_code && (
                    <ThemedText style={secondaryStyle}>
                      🔐 Code: {selectedBathroom.entry_code}
                    </ThemedText>
                  )}

                  {selectedBathroom.instructions && (
                    <ThemedText style={secondaryStyle}>
                      📝 Instructions: {selectedBathroom.instructions}
                    </ThemedText>
                  )}

                  <ThemedText style={bodyStyle}>
                    🚶 Used {usageCount} {usageCount === 1 ? 'time' : 'times'}
                  </ThemedText>

                  <View style={styles.buttonSpacing}>
                    <Button title="👍 Mark as Used" color={colors.primary} onPress={handleMarkUsed} />
                  </View>
                  <View style={styles.buttonSpacing}>
                    <Button title="🧭 Get Directions" color={colors.accent} onPress={handleGetDirections} />
                  </View>

                  {/* Favorites toggle */}
                  <View style={styles.buttonSpacing}>
                    <TouchableOpacity
                      onPress={toggleFavorite}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Ionicons
                        name={isFav ? 'star' : 'star-outline'}
                        size={24}
                        color={colors.accent}
                      />
                      <ThemedText style={[ bodyStyle, { marginLeft: spacing.sm } ]}>
                        {isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </ThemedView>

                <ThemedText style={[bodyStyle, { fontWeight: typography.body.fontWeight as any }]}>
                  💬 Comments
                </ThemedText>

                <FlatList
                  data={comments}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <ThemedText style={commentStyle}>• {item.text}</ThemedText>
                  )}
                  ListEmptyComponent={<ThemedText style={commentStyle}>No comments yet.</ThemedText>}
                  contentContainerStyle={styles.commentListContainer}
                />

                <TextInput
                  placeholder="Add a comment..."
                  placeholderTextColor={colors.textSecondary}
                  value={newComment}
                  onChangeText={setNewComment}
                  style={inputStyle}
                />
                <Button title="Submit Comment" color={colors.primary} onPress={handleCommentSubmit} />

                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <ThemedText style={closeStyle}>Close</ThemedText>
                </TouchableOpacity>

                {!isPremium && <View style={{ marginTop: spacing.lg }} />}
              </>
            )}
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  )
}



//   <View style={{
//     position: 'absolute',
//     bottom: 0,
//     width: '100%',
//     alignItems: 'center',
//     paddingBottom: 8,
//   }}>
//     <BannerAd
//       unitId={TestIds.BANNER}
//       size={BannerAdSize.FULL_BANNER}
//       requestOptions={{ requestNonPersonalizedAdsOnly: true }}
//       onAdFailedToLoad={(error) => console.error('Ad failed to load:', error)}
//     />
//   </View>
