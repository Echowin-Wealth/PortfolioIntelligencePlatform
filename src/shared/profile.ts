import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './hooks/useAuth';

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  phone_verified: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, 'name' | 'phone' | 'phone_verified'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Profile;
}

export function useProfile() {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user?.id ?? null;
  const [profile, setProfile] = useState<Profile | null>(null);
  // Which user the loaded profile belongs to. While this lags behind the
  // current session user, we must report `loading` so consumers don't treat a
  // not-yet-fetched profile as "no profile" — otherwise an admin signing in
  // gets routed to "/" before their is_admin flag has even been fetched.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoadedFor(null);
      return;
    }
    try {
      const p = await fetchProfile(userId);
      setProfile(p);
    } catch {
      setProfile(null);
    } finally {
      // Mark resolved for this user even on error, so we never get stuck in a
      // permanent loading state.
      setLoadedFor(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  // Loading until the profile we hold matches the current signed-in user.
  const loading = authLoading || (userId !== null && loadedFor !== userId);

  return { profile, loading, refresh };
}
