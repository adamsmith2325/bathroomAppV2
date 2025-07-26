import { Ionicons } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import React from 'react';
import {
  Button,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText } from '../components/Themed';
import { useTheme } from '../lib/themeContext';
import styles from './BathroomDetailsModal.styles';

export interface Bathroom {
  id: string;
  title: string;
  entry_code?: string;
  instructions?: string;
}

export interface CommentWithProfileRow {
  id: string
  text: string
  created_at: string
  user_id: string
  profile: {
    name: string
    avatar_url: string | null
  }[]    // ← note the `[]` here
}

interface Props {
  visible: boolean;
  bathroom: Bathroom;
  usageCount: number;
  comments: CommentWithProfileRow[];
  newComment: string;
  isPremium: boolean;
  isFav: boolean;
  onMarkUsed(): void;
  onToggleFavorite(): void;
  onGetDirections(): void;
  onChangeComment(text: string): void;
  onSubmitComment(): Promise<void>;
  onClose(): void;
}

export default function BathroomDetailsModal({
  visible,
  bathroom,
  usageCount,
  comments,
  newComment,
  isPremium,
  isFav,
  onMarkUsed,
  onToggleFavorite,
  onGetDirections,
  onChangeComment,
  onSubmitComment,
  onClose,
}: Props) {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  // dynamic text styles
  const headerTextStyle = {
    fontSize: typography.header.fontSize,
    fontWeight: typography.header.fontWeight as any,
    color: colors.text,
    marginBottom: spacing.sm,
  };
  const bodyTextStyle = {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight as any,
    color: colors.text,
    marginBottom: spacing.sm / 2,
  };
  const secondaryTextStyle = {
    fontSize: typography.body.fontSize * 0.9,
    fontWeight: typography.body.fontWeight as any,
    color: colors.textSecondary,
    marginBottom: spacing.sm / 2,
  };
  const commentNameStyle = {
    fontSize: typography.body.fontSize,
    fontWeight: '600' as any,
    color: colors.text,
  };
  const commentTextStyle = {
    fontSize: typography.body.fontSize,
    color: colors.text,
  };
  const commentTimeStyle = {
    fontSize: typography.body.fontSize * 0.8,
    color: colors.textSecondary,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 0}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <ScrollView
              contentContainerStyle={{ padding: spacing.md }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title */}
              <ThemedText style={headerTextStyle}>
                🚻 {bathroom.title}
              </ThemedText>

              {/* Entry code */}
              {bathroom.entry_code ? (
                <ThemedText style={secondaryTextStyle}>
                  🔐 Code: {bathroom.entry_code}
                </ThemedText>
              ) : null}

              {/* Instructions */}
              {bathroom.instructions ? (
                <ThemedText style={secondaryTextStyle}>
                  📝 Instructions: {bathroom.instructions}
                </ThemedText>
              ) : null}

              {/* Usage count */}
              <ThemedText style={bodyTextStyle}>
                🚶 Used {usageCount} {usageCount === 1 ? 'time' : 'times'}
              </ThemedText>

              {/* Mark as used */}
              <View style={styles.buttonRow}>
                <Button
                  title="👍 Mark as Used"
                  color={colors.primary}
                  onPress={onMarkUsed}
                />
              </View>

              {/* Get directions */}
              <View style={styles.buttonRow}>
                <Button
                  title="🧭 Get Directions"
                  color={colors.accent}
                  onPress={onGetDirections}
                />
              </View>

              {/* Favorite toggle */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={onToggleFavorite}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <Ionicons
                    name={isFav ? 'star' : 'star-outline'}
                    size={24}
                    color={colors.accent}
                  />
                  <ThemedText
                    style={[
                      bodyTextStyle,
                      { marginLeft: spacing.sm, color: colors.accent },
                    ]}
                  >
                    {isFav
                      ? 'Remove from Favorites'
                      : 'Add to Favorites'}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Comments section */}
              <ThemedText
                style={[
                  bodyTextStyle,
                  { marginTop: spacing.lg, fontWeight: typography.body.fontWeight as any },
                ]}
              >
                💬 Comments
              </ThemedText>

              <FlatList
                data={comments as CommentWithProfileRow[]}
                keyExtractor={c => c.id}
                renderItem={({ item }) => {
                  // pick the first (and only) profile row, or a fallback
                  const prof = (item.profile && item.profile[0]) ?? {
                    name: 'Unknown',
                    avatar_url: null,
                  };

                  return (
                    <View style={styles.commentRow}>
                      {prof.avatar_url && (
                        <Image
                          source={{ uri: prof.avatar_url }}
                          style={styles.commentAvatar}
                        />
                      )}
                      <View style={styles.commentContent}>
                        <ThemedText style={styles.commentName}>
                          {prof.name}
                        </ThemedText>
                        <ThemedText style={styles.commentText}>
                          {item.text}
                        </ThemedText>
                        <ThemedText style={styles.commentTimestamp}>
                          {new Date(item.created_at).toLocaleString()}
                        </ThemedText>
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <ThemedText style={styles.commentEmpty}>
                    No comments yet.
                  </ThemedText>
                }
              />


              {/* New comment input */}
              <TextInput
                placeholder="Add a comment…"
                placeholderTextColor={colors.textSecondary}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.sm,
                  padding: spacing.sm,
                  color: colors.text,
                  marginTop: spacing.lg,
                }}
                value={newComment}
                onChangeText={onChangeComment}
              />

              <View style={{ marginTop: spacing.sm }}>
                <Button
                  title="Submit Comment"
                  color={colors.primary}
                  onPress={async () => {
                    try {
                      await onSubmitComment();
                    } catch (err: any) {
                      // Extra safety
                      Sentry.captureException(err);
                    }
                  }}
                  disabled={!newComment.trim()}
                />
              </View>
            </ScrollView>

            {/* Close */}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <ThemedText
                style={{
                  fontSize: typography.body.fontSize,
                  fontWeight: typography.body.fontWeight as any,
                  color: colors.error,
                  textAlign: 'center',
                  padding: spacing.md / 2,
                }}
              >
                Close
              </ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
