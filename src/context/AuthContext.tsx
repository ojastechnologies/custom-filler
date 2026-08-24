'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  loading: boolean;
  checkUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Shared profile loader. A FAILED role lookup must not log the user out
  // conceptually — keep the session identity and just mark non-admin.
  const applySessionUser = useCallback(async (userId: string, email?: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUser({
        id: userId,
        email: email || '',
        role: userData?.role,
      });
      setIsAdmin(userData?.role === 'admin');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser({ id: userId, email: email || '' });
      setIsAdmin(false);
    }
  }, []);

  const checkUserRole = useCallback(async () => {
    // Hard ceiling: auth resolution must never wedge the entire app behind
    // the loading gate. Whatever happens below, loading ends up false.
    const timeout = new Promise<'timeout'>((resolve) =>
      setTimeout(() => resolve('timeout'), 8000),
    );

    const work = (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('supabase.auth.token', JSON.stringify(session));
          }
          await applySessionUser(session.user.id, session.user.email);
        } else {
          setUser(null);
          setIsAdmin(false);
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('supabase.auth.token');
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUser(null);
        setIsAdmin(false);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('supabase.auth.token');
        }
      }
    })();

    await Promise.race([work, timeout]);
    setLoading(false);
  }, [applySessionUser]);

  useEffect(() => {
    let cancelled = false;

    const persistSession = (session: Session | null) => {
      if (typeof window === 'undefined') return;
      if (session) {
        sessionStorage.setItem('supabase.auth.token', JSON.stringify(session));
      } else {
        sessionStorage.removeItem('supabase.auth.token');
      }
    };

    void checkUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return;
        persistSession(session);

        if (session?.user) {
          // CRITICAL: do not await Supabase queries inside this callback.
          // The auth client notifies subscribers while holding an internal
          // lock; awaiting another client call here deadlocks the whole auth
          // stack (observed as the entire site rendering a blank screen).
          // Defer all follow-up work to a macrotask outside the notification.
          const { id, email } = session.user;
          setTimeout(() => {
            if (cancelled) return;
            void applySessionUser(id, email).finally(() => setLoading(false));
          }, 0);
          return;
        }

        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [checkUserRole, applySessionUser]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('supabase.auth.token');
    }

    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      signOut,
      loading,
      checkUserRole
    }}>
      {/* Children always render — individual pages gate themselves via
          useAuth().loading. Gating the WHOLE tree here turned any auth hiccup
          into a fully blank site. */}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
