// src/components/BathroomDetailsModal.tsx
import * as Sentry from '@sentry/react-native'
import * as Linking from 'expo-linking'
import React, { useEffect, useState } from 'react'
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView
} from 'react-native'
import { ThemedView } from '../components/Themed'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/themeContext'
import { useSession } from '../lib/useSession'
import styles from './BathroomDetailsModal.styles'; // ← styles must be `export default styles` in that file

/** What comes back from Supabase */
interface CommentWithProfileRow {
  id: string
  text: string
  created_at: string
  user_id: string
  profiles: {
    name: string
    avatar_url: string | null
  }[]
}

/** What we actually use in our state */
export interface CommentWithProfile {
  id: string
  text: string
  created_at: string
  user_id: string
  profile: {
    name: string
    avatar_url: string | null
  }
}

export interface Bathroom {
  id: string
  title: string
  entry_code?: string
  instructions?: string
  lat: number
  lng: number
}

interface Props {
  bathroom: Bathroom | null
  visible: boolean
  onClose: () => void
}

export default function BathroomDetailsModal({ bathroom, visible, onClose }: Props) {
  const { theme } = useTheme()
  const { colors, spacing, borderRadius, typography } = theme
  const { user, isPremium } = useSession()

  const [comments, setComments] = useState<CommentWithProfile[]>([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const [isFav, setIsFav] = useState(false)

  useEffect(() => {
    if (bathroom) {
      fetchComments()
      fetchUsageCount()
      checkFavorite()
    }
  }, [bathroom, user])

  /** Fetch and flatten comments */
  async function fetchComments() {
    if (!bathroom) return
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(
          `id, text, created_at, user_id,
           profiles ( name, avatar_url )`
        )
        .eq('bathroom_id', bathroom.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      // Supabase returns an array of untyped objects; cast it:
      const rows = (data ?? []) as CommentWithProfileRow[]

      const mapped: CommentWithProfile[] = rows.map(row => ({
        id: row.id,
        text: row.text,
        created_at: row.created_at,
        user_id: row.user_id,
        profile: row.profiles[0] ?? { name: 'Unknown', avatar_url: null },
      }))

      setComments(mapped)
    } catch (err: any) {
      Sentry.captureException(err)
      Alert.alert('Error loading comments', err.message)
    }
  }

  /** Fetch usage count */
  async function fetchUsageCount() {
    if (!bathroom) return
    const { count, error } = await supabase
      .from('bathroom_usage')
      .select('*', { count: 'exact', head: true })
      .eq('bathroom_id', bathroom.id)
    if (!error && typeof count === 'number') {
      setUsageCount(count)
    }
  }

  /** Check favorite status */
  async function checkFavorite() {
    if (!bathroom || !user) return
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('bathroom_id', bathroom.id)
      .eq('user_id', user.id)
      .single()
    setIsFav(!!data)
  }

  /** Submit a new comment */
  async function handleCommentSubmit() {
    if (!newComment.trim() || !bathroom) {
      return Alert.alert('Please enter a comment first.')
    }
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          bathroom_id: bathroom.id,
          text: newComment.trim(),
          user_id: user?.id,
        })
        .single()
      if (error) throw error
      setNewComment('')
      await fetchComments()
    } catch (err: any) {
      Sentry.captureException(err)
      Alert.alert('Error', err.message || 'Could not submit comment.')
    } finally {
      setSubmitting(false)
    }
  }

  /** Mark as used */
  async function handleMarkUsed() {
    if (!bathroom || !user) return
    const { error } = await supabase.from('bathroom_usage').insert({
      bathroom_id: bathroom.id,
      user_id: user.id,
    })
    if (!error) {
      fetchUsageCount()
      Alert.alert('👍', 'Thanks for marking this bathroom as used!')
    }
  }

  /** Open maps */
  function handleGetDirections() {
    if (!bathroom) return
    const { lat, lng } = bathroom
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${lat},${lng}`
        : `google.navigation:q=${lat},${lng}`
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Unable to open directions.')
    )
  }

  /** Toggle favorite */
  async function toggleFavorite() {
    if (!bathroom || !user) return
    if (isFav) {
      await supabase
        .from('favorites')
        .delete()
        .eq('bathroom_id', bathroom.id)
        .eq('user_id', user.id)
      setIsFav(false)
    } else {
      await supabase
        .from('favorites')
        .insert({ bathroom_id: bathroom.id, user_id: user.id })
      setIsFav(true)
    }
  }

  if (!bathroom) return null

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <ThemedView style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
            <ThemedView style={[styles.modalContainer(spacing.md), { backgroundColor: colors.background }]}>
              {/* ... the rest of your existing JSX stays unchanged ... */}
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
