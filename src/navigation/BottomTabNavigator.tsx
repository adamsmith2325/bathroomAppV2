// src/navigation/BottomTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapScreen from '../screens/MapScreen';
import AddBathroomScreen from '../screens/AddBathroomScreen';
import MyAccountScreen from '../screens/MyAccountScreen';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/themeContext';

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
      <Tab.Screen name="Account" component={MyAccountScreen} />
    </Tab.Navigator>
  );
}

export default MainTabs;
