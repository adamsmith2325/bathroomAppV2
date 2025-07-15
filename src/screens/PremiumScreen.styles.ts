import { StyleSheet, ViewStyle } from 'react-native'

interface Styles {
  container: ViewStyle
  container2: ViewStyle
  loading: ViewStyle
  card: ViewStyle
  cardLeft: ViewStyle
  cardBody: ViewStyle
  cardRight: ViewStyle
  emptyContainer: ViewStyle
}

export default StyleSheet.create<Styles>({

  return StyleSheet.create({a
    container: {
      flex: 1,
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    header: {
      fontSize: typography.h1.fontSize,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.md,
    },
    description: {
      fontSize: typography.body.fontSize,
      color: colors.text,
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    link: {
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    button: {
      backgroundColor: colors.accent,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
}
