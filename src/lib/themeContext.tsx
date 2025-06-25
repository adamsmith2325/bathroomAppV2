// src/lib/themeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { lightTheme, darkTheme, Theme } from '../design/theme';
import { useSession } from './useSession';
import { supabase } from './supabase';

interface ThemeContextValue {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  isDarkMode: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user } = useSession();

  useEffect(() => {
    const loadThemePreference = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('dark_mode')
          .eq('id', user.id)
          .single();

        if (!error && data?.dark_mode !== undefined) {
          setIsDarkMode(data.dark_mode);
        }
      }
    };

    loadThemePreference();
  }, [user]);

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    if (user) {
      await supabase
        .from('profiles')
        .update({ dark_mode: newMode })
        .eq('id', user.id);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
