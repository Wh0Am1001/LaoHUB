import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data ?? null);
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  useEffect(() => {
    // Supabase fires this listener immediately upon subscribing with the
    // currently known session (restored from persisted storage on a fresh
    // load, or null if there isn't one). Relying on this single source of
    // truth -- instead of also calling `getSession()` in parallel -- avoids
    // a race where two independent async checks can resolve in either
    // order: if the parallel `getSession()` call happened to resolve first
    // with a stale/empty result, `loading` would flip to false with
    // `user = null`, briefly rendering the login page even though a valid
    // session was about to load a moment later.
    let resolvedInitialState = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        fetchProfile(newSession.user.id).finally(() => {
          if (!resolvedInitialState) {
            resolvedInitialState = true;
            setLoading(false);
          }
        });
        supabase.from('profiles').update({ online: true }).eq('id', newSession.user.id).then();
      } else {
        setProfile(null);
        if (!resolvedInitialState) {
          resolvedInitialState = true;
          setLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    if (user) {
      await supabase.from('profiles').update({ online: false }).eq('id', user.id);
    }
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
