import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useSession } from '../lib/useSession';
import { useTheme }   from '../lib/themeContext';
import { Button }     from '../components/Button';
import { Card }       from '../components/Card';
import { styles }     from './MyAccountScreen.styles';

export default function MyAccountScreen() {
  const { user, signOut } = useSession();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <View style={styles.container(theme)}>
      <Card style={styles.profileCard}>
        <Text style={{ color: theme.colors.text }}>Signed in as:</Text>
        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{user?.email}</Text>
      </Card>
      <View style={styles.toggleRow}>
        <Text style={{ color: theme.colors.text, marginRight: theme.spacing.sm }}>Dark Mode</Text>
        <Switch value={isDark} onValueChange={toggleTheme} />
      </View>
      <Button variant="secondary" label="Sign Out" onPress={signOut} />
    </View>
  );
}
