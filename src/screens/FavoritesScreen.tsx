import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native'
import { ThemedText, ThemedView } from '../components/Themed'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/themeContext'
import { useSession } from '../lib/useSession'
import styles from './FavoritesScreen.styles'

interface Bathroom {
  id: string
  title: string
  lat: number
  lng: number
}

export function FavoritesScreen() {
  const { theme } = useTheme()
  const { colors, spacing, borderRadius, typography } = theme
  const { user } = useSession()

  const [favorites, setFavorites] = useState<Bathroom[]>([])
  const [loading, setLoading] = useState(true)

  // Prepare typed text styles
  const bodyTextStyle = {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight as TextStyle['fontWeight'],
    color: colors.text,
  } as TextStyle

  const smallTextStyle = {
    fontSize: typography.small.fontSize,
    fontWeight: typography.small.fontWeight as TextStyle['fontWeight'],
    color: colors.textSecondary,
  } as TextStyle

  const fetchFavorites = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('favorites')
      .select('bathroom_id, bathrooms(id, title, lat, lng)')
      .eq('user_id', user.id)

    if (!error && data) {
      setFavorites(
        data.map((row: any) => ({
          id: row.bathrooms.id,
          title: row.bathrooms.title,
          lat: row.bathrooms.lat,
          lng: row.bathrooms.lng,
        }))
      )
    }
    setLoading(false)
  }

  useFocusEffect(
    useCallback(() => {
      fetchFavorites()
    }, [user])
  )

  const removeFavorite = async (bathroomId: string) => {
    if (!user) return
    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('bathroom_id', bathroomId)
    fetchFavorites()
  }

  if (loading) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.container2} />
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <View style={styles.cardLeft}>
              <Ionicons name="locate-outline" size={24} color={colors.primary} />
            </View>

            <View style={styles.cardBody}>
              <ThemedText style={[bodyTextStyle, { marginBottom: spacing.xs }]}>
                {item.title}
              </ThemedText>
              <ThemedText style={smallTextStyle}>
                {item.lat.toFixed(3)}, {item.lng.toFixed(3)}
              </ThemedText>
            </View>

            <TouchableOpacity
              onPress={() => removeFavorite(item.id)}
              style={styles.cardRight}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <ThemedView style={[styles.emptyContainer, { padding: spacing.lg }]}>
            <ThemedText style={smallTextStyle}>
              You haven’t added any favorites yet.
            </ThemedText>
          </ThemedView>
        }
      />
    </ThemedView>
  )
}
