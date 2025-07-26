// src/navigation/MainTabs.tsx
import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import React, { useState } from 'react'
import { TouchableOpacity } from 'react-native'
import WelcomeModal from '../components/WelcomeModal'
import { useTheme } from '../lib/themeContext'
import { useSession } from '../lib/useSession'
import { AddBathroomScreen } from '../screens/AddBathroomScreen'
import { FavoritesScreen } from '../screens/FavoritesScreen'
import MapScreen from '../screens/MapScreen'
import { MyAccountScreen } from '../screens/MyAccountScreen'

const Tab = createBottomTabNavigator()

export function MainTabs() {
  const { theme } = useTheme()
  const { profile } = useSession();
  const [helpVisible, setHelpVisible] = useState(false);

  const handleHelpFinish = async () => {
    setHelpVisible(false);
    // note: you probably don't want to re-set welcome_seen here
  };

  return (
    <>
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
      <Tab.Screen   name="Map"
  component={MapScreen}
  options={({ navigation }) => ({
    headerRight: () => (
      <TouchableOpacity
        onPress={() =>
          // simply bubble up an event or use a shared ref/state
          navigation.navigate('WelcomeTour')
        }
        style={{ marginRight: 16 }}
      >
        <Ionicons name="help-circle-outline" size={24} color="#fff" />
      </TouchableOpacity>
    ),
  })}
/>
      <Tab.Screen name="Add" component={AddBathroomScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Account" component={MyAccountScreen} />
    </Tab.Navigator>
    <WelcomeModal
        visible={helpVisible}
        onFinish={handleHelpFinish}
      />
  </>
  )
}
