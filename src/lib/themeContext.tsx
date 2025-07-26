// src/lib/themeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage'
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Appearance } from 'react-native'
import { darkTheme, lightTheme, Theme } from '../design/theme'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  /** The active theme object (colors, spacing, etc.) */
  theme: Theme
  /** The current mode string */
  mode: ThemeMode
  /** Toggle between light & dark */
  toggleTheme: () => void
}

const STORAGE_KEY = 'app_theme_mode'

/** Provide sensible defaults so server & client match */
const defaultMode: ThemeMode = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultMode === 'light' ? lightTheme : darkTheme,
  mode: defaultMode,
  toggleTheme: () => {},
})

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(defaultMode)

  // On mount: load any persisted override
  useEffect(() => {
    ;(async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') {
        setMode(stored)
      }
    })()
    // Listen for system‐level changes, if no override
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
        if (!stored && colorScheme) {
          setMode(colorScheme as ThemeMode)
        }
      })
    })
    return () => sub.remove()
  }, [])

  const toggleTheme = async () => {
    const next = mode === 'light' ? 'dark' : 'light'
    setMode(next)
    // Persist override
    await AsyncStorage.setItem(STORAGE_KEY, next)
  }

  const theme = mode === 'light' ? lightTheme : darkTheme

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook for components/screens to read theme & toggle it
export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
