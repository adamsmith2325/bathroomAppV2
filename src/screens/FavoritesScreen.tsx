// src/screens/FavoritesScreen.tsx
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList } from 'react-native'
import { ThemedText, ThemedView } from '../components/Themed'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/themeContext'
import styles from './FavoritesScreen.styles'

type Bathroom = {
  id: string
  title: string
  coords: { lat: number; lng: number }
}

export function FavoritesScreen() {
  const { theme } = useTheme()
  const { spacing, colors } = theme

  const [favorites, setFavorites] = useState<Bathroom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true)
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser()

      if (userErr || !user) {
        console.error('Auth error:', userErr)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('bathrooms ( id, title, lat, lng )')
        .eq('user_id', user.id)

      if (error) {
        console.error('Fetch favorites error:', error)
      } else if (data) {
        const list = data.map((f: any) => ({
          id: f.bathrooms.id,
          title: f.bathrooms.title,
          coords: { lat: f.bathrooms.lat, lng: f.bathrooms.lng },
        }))
        setFavorites(list)
      }
      setLoading(false)
    }

    fetchFavorites()
  }, [])

  if (loading) {
    return (
      <ThemedView style={styles.container(spacing.md)}>
        <ActivityIndicator color={colors.primary} />
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container(spacing.md)}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThemedText style={styles.itemText(spacing.sm)}>
            {item.title}
          </ThemedText>
        )}
      />
    </ThemedView>
  )
}
