import { StyleSheet } from 'react-native';
import { useTheme } from '../lib/themeContext';

export default function usePremiumStyles() {
  const { spacing, typography, colors, borderRadius } = useTheme().theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.lg,
    },
    scrollContainer: {
      paddingBottom: spacing.xl,
    },
    header: {
      fontSize: typography.h1.fontSize,
      fontWeight: typography.h1.fontWeight as any,
      color: colors.text,
      marginBottom: spacing.md,
    },
    description: {
      color: colors.text,
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    link: {
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    linkLast: {
      color: colors.primary,
      marginBottom: spacing.lg,
    },
    planButton: {
      backgroundColor: colors.accent,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    planButtonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
}