// src/screens/PremiumScreen.styles.ts
import { StyleSheet } from 'react-native';
import type { Theme } from '../lib/themeContext'; // adjust import if you have a Theme type

export default function makeStyles(theme: Theme) {
  const { spacing, typography, colors, borderRadius } = theme;

  return StyleSheet.create({
    // root container
    container: {
      flex: 1,
      padding: spacing.lg,
    },

    // ScrollView contentContainerStyle
    scrollContent: {
      paddingBottom: spacing.xl,
    },

    // Big header text
    header: {
      fontSize: typography.h1.fontSize,
      fontWeight: typography.h1.fontWeight as any,
      color: colors.text,
      marginBottom: spacing.md,
    },

    // Descriptive paragraph under header
    description: {
      color: colors.text,
      lineHeight: 22,
      marginBottom: spacing.lg,
    },

    // Link style (Privacy Policy)
    link: {
      color: colors.primary,
      marginBottom: spacing.md,
    },

    // Last link has a larger bottom margin
    linkLast: {
      color: colors.primary,
      marginBottom: spacing.lg,
    },

    // Button for each subscription plan
    planButton: {
      backgroundColor: colors.accent,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      marginTop: spacing.md,
    },

    // Text inside the planButton
    planButtonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
}