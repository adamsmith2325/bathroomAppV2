// src/lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// 1️⃣ Read your bundled extras
const { SUPABASE_URL, SUPABASE_ANON_KEY } =
  (Constants.expoConfig?.extra || {}) as Record<string,string>

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials in expo.extra!')
}

// 2️⃣ Create the client with AsyncStorage enabled
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

// 3️⃣ Immediately try to rehydrate from whatever auth‐token key is present
;(async () => {
  try {
    // list all keys, find the one ending in "-auth-token"
    const allKeys = await AsyncStorage.getAllKeys()
    const tokenKey = allKeys.find((k) => k.endsWith('-auth-token'))

    console.log('🔑 detected Supabase key:', tokenKey)

    if (tokenKey) {
      const raw = await AsyncStorage.getItem(tokenKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        // supabase-js v2 stores the session under parsed.currentSession
        const session = parsed.currentSession ?? parsed
        if (session?.access_token && session?.refresh_token) {
          await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          })
          console.log('🔄 manually restored Supabase session from', tokenKey)
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ error restoring Supabase session:', err)
  }
})()
