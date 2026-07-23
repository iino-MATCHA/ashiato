import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { me } from './mock';

export interface Profile {
  name: string;
  username: string;
  bio: string;
}

// tiny shared store so the profile stays in sync across pages
let current: Profile = { name: me.name, username: me.username, bio: '' };
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

async function loadFromDb() {
  if (!isSupabaseConfigured) return;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return;
  const { data } = await supabase.from('profiles').select('display_name, username, bio').eq('id', uid).single();
  if (data) {
    current = { name: data.display_name ?? current.name, username: data.username ?? current.username, bio: data.bio ?? '' };
    emit();
  }
}

export async function saveProfile(next: Profile) {
  current = next;
  emit();
  if (!isSupabaseConfigured) return;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return;
  await supabase.from('profiles').upsert({ id: uid, display_name: next.name, username: next.username, bio: next.bio });
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(current);
  useEffect(() => {
    const l = () => setProfile({ ...current });
    listeners.add(l);
    loadFromDb();
    return () => {
      listeners.delete(l);
    };
  }, []);

  const update = (next: Profile) => saveProfile(next);
  const signOut = async () => {
    if (isSupabaseConfigured) {
      try { await supabase.auth.signOut(); } catch {}
    }
  };

  return { profile, update, signOut };
}
