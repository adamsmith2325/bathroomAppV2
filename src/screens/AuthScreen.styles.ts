// src/screens/AuthScreen.styles.ts
import type { ViewStyle, TextStyle } from 'react-native';
import type { Theme } from '../design/theme';

export const styles: {
  container: (theme: Theme) => ViewStyle;
  title:     (theme: Theme) => TextStyle;
  input:     (theme: Theme) => TextStyle;
  buttonsRow: ViewStyle;
} = {
  container: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  }),
  title: (theme) => ({
    color: theme.colors.text,
    fontSize: theme.typography.header.fontSize,
    // Cast fontWeight to the exact TextStyle union
    fontWeight: theme.typography.header.fontWeight as TextStyle['fontWeight'],
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  }),
  input: (theme) => ({
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
    width: '100%',
  }),
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  } as ViewStyle,
};
