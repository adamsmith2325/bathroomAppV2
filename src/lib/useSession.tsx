import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({} as any);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Load initial session and listen to auth changes
  useEffect(() => {
    const getInitialSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Failed to get initial session:', error.message);
      }
      console.log('Initial session:', data.session);
      setSession(data.session);
      setUser(data.session?.user ?? null);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state change:', session);
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Signing in...');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('SignIn error:', error.message);
      throw error;
    }

    console.log('SignIn success:', data.session);
    setSession(data.session);
    setUser(data.user);
  };

  const signUp = async (email: string, password: string) => {
    console.log('Signing up...');
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error('SignUp error:', error.message);
      throw error;
    }

    console.log('SignUp result:', data);

    // If session is returned (i.e. email confirmation is OFF), set it immediately
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
    }

    // Create profile entry
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, dark_mode: true });

      if (profileError) {
        console.warn('Profile insert error:', profileError.message);
      }
    }
  };

  const signOut = async () => {
    console.log('Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('SignOut error:', error.message);
      throw error;
    }

    setSession(null);
    setUser(null);
  };

  return (
    <SessionContext.Provider value={{ session, user, signIn, signUp, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
