import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from './supabase';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isPremium: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({} as any);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);

  // Fetch session and listen for changes
  useEffect(() => {
    const loadInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
    };

    loadInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch is_premium from profiles
  useEffect(() => {
    const fetchPremiumStatus = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setIsPremium(data.is_premium);
      } else {
        console.warn('Failed to fetch is_premium:', error?.message);
      }
    };

    fetchPremiumStatus();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    setSession(data.session);
    setUser(data.user);
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.session) {
      setSession(data.session);
      setUser(data.user);
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        dark_mode: true,
        is_premium: false, // default to false
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsPremium(false);
  };

  return (
    <SessionContext.Provider
      value={{ session, user, isPremium, signIn, signUp, signOut }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
