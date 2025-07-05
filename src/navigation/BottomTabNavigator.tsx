// src/navigation/BottomTabNavigator.tsx
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { useTheme } from '../lib/themeContext';
import AddBathroomScreen from '../screens/AddBathroomScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import MapScreen from '../screens/MapScreen';
import { MyAccountScreen } from '../screens/MyAccountScreen';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Map: 'map',
            Add: 'add-circle',
            Account: 'person',
          } as const;

          return <Ionicons name={icons[route.name as keyof typeof icons]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Add" component={AddBathroomScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Account" component={MyAccountScreen} />

    </Tab.Navigator>
  );
}

export default MainTabs;
