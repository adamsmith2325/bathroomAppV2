// src/screens/AuthScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { useSession } from '../lib/useSession';
import { useTheme } from '../lib/themeContext';
import { Button } from '../components/Button';
import { styles } from './AuthScreen.styles';

export function AuthScreen() {
  const { signIn, signUp } = useSession();
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    try {
      await signIn(email, password);
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message || String(err));
    }
  };

  const handleSignUp = async () => {
    try {
      await signUp(email, password);
      console.log("Sign-up Pressed");
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.message || String(err));
    }
  };

  return (
    <View style={styles.container(theme)}>
      <Text style={styles.title(theme)}>Public Restroom Finder</Text>
      <TextInput
        style={styles.input(theme)}
        placeholder="Email"
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input(theme)}
        placeholder="Password"
        placeholderTextColor={theme.colors.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.buttonsRow}>
        <Button label="Sign In" onPress={handleSignIn} />
        <Button variant="secondary" label="Sign Up" onPress={handleSignUp} />
      </View>
    </View>
  );
}
