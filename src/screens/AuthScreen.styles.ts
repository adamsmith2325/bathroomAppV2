// src/screens/AuthScreen.styles.ts
import type { TextStyle, ViewStyle } from 'react-native'
import type { Theme } from '../design/theme'

export const styles: {
  container: (theme: Theme) => ViewStyle
  title:     (theme: Theme) => TextStyle
  input:     (theme: Theme) => TextStyle
  buttonsRow: ViewStyle
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
    justifyContent: 'space-between', // push them to the edges
    width: '100%',                    // take full width
    paddingHorizontal: 50,            // optional: add some side padding
    marginTop: 16,                    // optional: space from inputs
  } as ViewStyle,
}
