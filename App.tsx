// App.tsx (root-level file)
import React from 'react';
import { SessionProvider } from './src/lib/useSession';
import { RootNavigator } from './src/navigation';
import { ThemeProvider } from './src/lib/themeContext';

export default function App() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SessionProvider>
  );
}
