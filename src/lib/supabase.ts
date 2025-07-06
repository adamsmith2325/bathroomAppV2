

// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// grab your EXPO_PUBLIC_SUPABASE_URL / ANON_KEY from app.json → extra
const { EXPO_PUBLIC_SUPABASE_URL: SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY } =
  (Constants.expoConfig?.extra ?? {}) as Record<string, string>

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
  },
})

