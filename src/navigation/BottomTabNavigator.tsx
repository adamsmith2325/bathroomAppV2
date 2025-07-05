// src/navigation/MainTabs.tsx
import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import React from 'react'
import { useTheme } from '../lib/themeContext'

import { AddBathroomScreen } from '../screens/AddBathroomScreen'
import { FavoritesScreen } from '../screens/FavoritesScreen'
import MapScreen from '../screens/MapScreen'
import { MyAccountScreen } from '../screens/MyAccountScreen'

const Tab = createBottomTabNavigator()

export function MainTabs() {
  const { theme } = useTheme()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: { backgroundColor: theme.colors.surface },
        tabBarIcon: ({ color, size }) => {
          let name: React.ComponentProps<typeof Ionicons>['name'] = 'ellipse'
          if (route.name === 'Map') name = 'map-outline'
          if (route.name === 'Add') name = 'add-circle-outline'
          if (route.name === 'Favorites') name = 'star-outline'
          if (route.name === 'Account') name = 'person-circle-outline'
          return <Ionicons name={name} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Add" component={AddBathroomScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Account" component={MyAccountScreen} />
    </Tab.Navigator>
  )
}
