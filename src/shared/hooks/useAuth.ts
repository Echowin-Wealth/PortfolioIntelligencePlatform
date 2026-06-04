import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    // Load supabase-js on demand so its large bundle stays out of the landing
    // page's critical render path. Auth state resolves a tick after first paint.
    void import('../supabaseClient').then(({ supabase }) => {
      if (cancelled) return;
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setLoading(false);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next);
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const signOut = async () => {
    const { supabase } = await import('../supabaseClient');
    return supabase.auth.signOut();
  };

  return { session, loading, signOut };
}
