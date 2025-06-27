// src/design/theme.ts
import type { TextStyle } from 'react-native'

export const lightTheme = {
  colors: {
    primary:       '#007aff',
    accent:        '#ff9500',
    background:    '#ffffff',
    surface:       '#f2f2f2',
    text:          '#000000',
    textSecondary: '#666666',
    success:       '#34c759',
    warning:       '#ffcc00',
    error:         '#ff3b30',
    onPrimary:     '#ffffff',
    border:        '#e0e0e0',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  typography: {
    header: {
      fontSize:   24,
      fontWeight: '700' as TextStyle['fontWeight'],
    },
    body: {
      fontSize:   16,
      fontWeight: '400' as TextStyle['fontWeight'],
    },
    small: {
      fontSize:   14,
      fontWeight: '300' as TextStyle['fontWeight'],
    },
  },
}

export const darkTheme: typeof lightTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background:    '#000000',
    surface:       '#1c1c1e',
    text:          '#ffffff',
    textSecondary: '#aaaaaa',
    onPrimary:     '#000000',
    border:        '#333333',
  },
}

export type Theme = typeof lightTheme
