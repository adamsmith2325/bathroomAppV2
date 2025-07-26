// src/lib/useSession.tsx
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Session, User } from '@supabase/supabase-js'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { supabase } from './supabase'

interface Profile {
  id: string
  email: string
  name: string
  avatar_url: string | null
  notifyRadius: number
  is_premium: boolean
  welcome_seen: boolean
}

interface SessionContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  isPremium: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextType>({} as any)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 1) Load initial session & subscribe for auth changes
  useEffect(() => {
    // initial load
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      console.log('🛠️ [useSession] initial session load →', data.session)
      setSession(data.session)
      setUser(data.session?.user ?? null)
    }
    load()

    // subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, sess) => {
        console.log('🛠️ [useSession] onAuthStateChange →', event, sess)
        setSession(sess)
        setUser(sess?.user ?? null)

        // clear profile only when user explicitly signs out
        if (event === 'SIGNED_OUT') {
          console.log('🛠️ [useSession] user signed out → clearing profile')
          setProfile(null)
          setIsPremium(false)
          AsyncStorage.removeItem('cached_profile').catch(() => {})
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // 2) When user logs in, insert defaults if needed and fetch profile
  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    let mounted = true
    const CACHE_KEY = 'cached_profile'

    const initProfile = async () => {
      setIsLoading(true)

      // a) load from cache
      const cached = await AsyncStorage.getItem(CACHE_KEY)
      if (cached && mounted) {
        console.log('🛠️ [useSession] loaded profile from cache →', cached)
        setProfile(JSON.parse(cached))
      }

      // b) insert default row (only if it doesn't exist)
      const { error: insertErr } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email ?? '',
          name: null,
          avatar_url: null,
          notify_radius: 0,
          is_premium: false,
          welcome_seen: false,
        })
      // ignore duplicate-key errors (code 23505)
      if (insertErr && insertErr.code !== '23505') {
        console.warn('🛠️ [useSession] insert default profile error', insertErr)
      }

      // c) fetch the canonical profile row
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, avatar_url, notify_radius, is_premium, welcome_seen')
        .eq('id', user.id)
        .single()

      console.log('🛠️ [useSession] fetch profile →', { data, error })
      if (!error && data && mounted) {
        const prof: Profile = {
          id: data.id,
          email: data.email,
          name: data.name,
          avatar_url: data.avatar_url,
          notifyRadius: data.notify_radius,
          is_premium: data.is_premium,
          welcome_seen: data.welcome_seen,
        }
        setProfile(prof)
        setIsPremium(prof.is_premium)
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(prof))
        console.log('🛠️ [useSession] cached profile to disk')
      }

      if (mounted) {
        setIsLoading(false)
      }
    }

    initProfile()
    return () => {
      mounted = false
    }
  }, [user])

  // 3) Auth actions
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // onAuthStateChange will trigger profile init
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    // onAuthStateChange will run initProfile
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    // onAuthStateChange will clear profile
  }

  return (
    <SessionContext.Provider
      value={{
        session,
        user,
        profile,
        isPremium,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)
