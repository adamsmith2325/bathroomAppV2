// components/Themed.tsx
import React from 'react';
import {
    Text as RNText,
    View as RNView,
    StyleProp,
    TextProps,
    TextStyle,
    ViewProps,
    ViewStyle,
} from 'react-native';
import { useTheme } from '../lib/themeContext';

export function ThemedView({
  style,
  ...rest
}: ViewProps & { style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  return <RNView {...rest} style={[{ backgroundColor: theme.colors.background }, style]} />;
}

export function ThemedText({
  style,
  ...rest
}: TextProps & { style?: StyleProp<TextStyle> }) {
  const { theme } = useTheme();
  return <RNText {...rest} style={[{ color: theme.colors.text }, style]} />;
}
