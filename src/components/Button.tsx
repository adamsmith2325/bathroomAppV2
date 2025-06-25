import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../lib/themeContext';

type Props = { label: string; onPress(): void; variant?: 'primary' | 'secondary' };

export const Button: React.FC<Props> = ({ label, onPress, variant = 'primary' }) => {
  const { theme } = useTheme();
  const isSecondary = variant === 'secondary';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: isSecondary ? theme.colors.surface : theme.colors.primary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        borderWidth: isSecondary ? 1 : 0,
        borderColor: isSecondary ? theme.colors.primary : undefined,
        alignItems: 'center'
      }}
    >
      <Text style={{
        color: isSecondary ? theme.colors.primary : theme.colors.onPrimary,
        fontSize: theme.typography.body.fontSize,
        fontWeight: theme.typography.body.fontWeight
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};
