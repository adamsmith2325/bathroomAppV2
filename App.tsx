// App.tsx
import {
  DefaultTheme as NavDefaultTheme,
  NavigationContainer,
} from '@react-navigation/native'
import React from 'react'

// your two context providers:
import { ThemeProvider, useTheme } from './src/lib/themeContext'
import { SessionProvider, useSession } from './src/lib/useSession'

import { darkTheme } from './src/design/theme'; // to detect dark/light
import BottomTabNavigator from './src/navigation/BottomTabNavigator'
import { AuthScreen } from './src/screens/AuthScreen'

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <AppInner />
      </SessionProvider>
    </ThemeProvider>
  )
}

function AppInner() {
  // 1) pull session from your hook with all your signIn/signOut etc
  const { session } = useSession()

  // 2) pull the full design theme object
  const { theme } = useTheme()

  // 3) figure out whether we're in dark mode
  const isDark = theme === darkTheme

  // 4) map your theme.tokens → React-Navigation theme
  const navTheme = {
    ...NavDefaultTheme,
    dark: isDark,
    colors: {
      ...NavDefaultTheme.colors,
      background: theme.colors.background,
      card:       theme.colors.surface,
      text:       theme.colors.text,
      primary:    theme.colors.primary,
      border:     theme.colors.border,
      notification: theme.colors.accent,
    },
  }

  return (
    <NavigationContainer theme={navTheme}>
      {session ? <BottomTabNavigator /> : <AuthScreen />}
    </NavigationContainer>
  )
}
