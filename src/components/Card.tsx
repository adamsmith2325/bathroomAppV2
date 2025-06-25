import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../lib/themeContext';

type Props = { children: React.ReactNode; style?: object };

export const Card: React.FC<Props> = ({ children, style }) => {
  const { theme } = useTheme();
  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
      ...style
    }}>
      {children}
    </View>
  );
};
