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

  // 1) Load initial session & subscribe
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      console.log('🛠️ [useSession] initial session load →', data.session)
      setSession(data.session)
      setUser(data.session?.user ?? null)
    }
    load()
    const { data: listener } = supabase.auth.onAuthStateChange((_, sess) => {
      console.log('🛠️ [useSession] onAuthStateChange →', sess)
      setSession(sess)
      setUser(sess?.user ?? null)
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // 2) Upsert, cache & fetch profile whenever `user` changes
  useEffect(() => {
    let mounted = true
    const KEY = 'cached_profile'

    const init = async () => {
      console.log('🛠️ [useSession] initProfile, user.id =', user?.id)
      if (!user) {
        console.log('🛠️ [useSession] no user, clearing profile')
        if (mounted) {
          setProfile(null)
          setIsPremium(false)
          setIsLoading(false)
        }
        return
      }

      // a) Load from storage cache
      const json = await AsyncStorage.getItem(KEY)
      if (json && mounted) {
        console.log('🛠️ [useSession] loaded profile from cache →', json)
        setProfile(JSON.parse(json))
      }

      setIsLoading(true)
      try {
        // b) Upsert defaults (snake_case)
        const { error: upsertErr } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              email: user.email ?? '',
              name: user.email?.split('@')[0] ?? '',
              avatar_url: null,
              notify_radius: 1000,
              is_premium: false,
            },
            { onConflict: 'id' }
          )
        if (upsertErr) {
          console.warn('🛠️ [useSession] upsert error:', upsertErr)
        }

        // c) Fetch full row (snake_case)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, name, avatar_url, notify_radius, is_premium')
          .eq('id', user.id)
          .single()

        console.log('🛠️ [useSession] fetch profile →', { data, error })
        if (!error && data && mounted) {
          // d) Map to your Profile interface
          const prof: Profile = {
            id: data.id,
            email: data.email,
            name: data.name,
            avatar_url: data.avatar_url,
            notifyRadius: data.notify_radius,
            is_premium: data.is_premium,
          }
          setProfile(prof)
          setIsPremium(prof.is_premium)
          await AsyncStorage.setItem(KEY, JSON.stringify(prof))
          console.log('🛠️ [useSession] cached profile to disk')
        }
      } catch (e) {
        console.warn('🛠️ [useSession] unexpected error:', e)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    init()
    return () => {
      mounted = false
    }
  }, [user])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    console.log('🔐 signIn → data.session:', data.session)
    console.log('🔐 signIn → data.user:', data.user)
    console.log('🔐 signIn → error:', error)
    if (error) throw error
    setSession(data.session)
    setUser(data.user)
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    console.log('🔐 signUp → data.session:', data.session)
    console.log('🔐 signUp → data.user:', data.user)
    console.log('🔐 signUp → error:', error)
    if (error) throw error
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email ?? '',
        name: data.user.email?.split('@')[0] ?? '',
        avatar_url: null,
        notify_radius: 1000,
        is_premium: false,
      })
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
    setIsPremium(false)
    await AsyncStorage.removeItem('cached_profile')
    console.log('🛠️ [useSession] signed out, cleared cache')
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
