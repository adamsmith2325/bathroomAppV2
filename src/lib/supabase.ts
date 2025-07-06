// src/lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// These keys must live in your app.json → expo.extra
const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} = Constants.expoConfig?.extra as {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in app.json extra!')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})
