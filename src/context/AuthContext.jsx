import { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const demo = localStorage.getItem('creativehub_demo_user');
      if (demo) {
        return { user: JSON.parse(demo) };
      }
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session ?? null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    return supabase.auth.signUp({ email, password });
  };

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('creativehub_demo_user');
    } catch {}
    setSession(null);
    if (!supabase) return { error: null };
    return supabase.auth.signOut();
  };

  const enterDemo = () => {
    const demoUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'creator@creativehub.studio',
      user_metadata: { display_name: 'Studio Explorer' },
    };
    try {
      localStorage.setItem('creativehub_demo_user', JSON.stringify(demoUser));
    } catch {}
    setSession({ user: demoUser });
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        enterDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
