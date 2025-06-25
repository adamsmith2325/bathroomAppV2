// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// fallback in case expoConfig is null or undefined
const extra = Constants.expoConfig?.extra || {};

const SUPABASE_URL = extra.SUPABASE_URL;
const SUPABASE_ANON_KEY = extra.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase URL or anon key in app.config.js/.env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
