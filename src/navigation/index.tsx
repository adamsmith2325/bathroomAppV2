// src/navigation/index.tsx
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useSession } from '../lib/useSession';
import { AuthScreen } from '../screens/AuthScreen';
import { MainTabs } from './BottomTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['bathroomappv2://'],
  config: {
    screens: {
      Auth: 'auth',
      MainTabs: {
        // optional `path` if you want a URL segment other than '':
        path: '',
        screens: {
          Map: 'map',
          Add: 'add',
          Favorites : 'favorite',
          Account: 'account',
        },
      },
    },
  },
};

export function RootNavigator() {
  const { session } = useSession();
  console.log('Session:', session);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
