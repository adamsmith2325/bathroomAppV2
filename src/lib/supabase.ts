// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Try to pull your public vars from Expo’s config
const expoExtras = (Constants.expoConfig?.extra ??
  // @ts-ignore manifest.extra only exists in some SDKs
  (Constants.manifest as any)?.extra) as
  | { EXPO_PUBLIC_SUPABASE_URL: string; EXPO_PUBLIC_SUPABASE_ANON_KEY: string }
  | undefined

const SUPABASE_URL =
  expoExtras?.EXPO_PUBLIC_SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY =
  expoExtras?.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
  },
})
