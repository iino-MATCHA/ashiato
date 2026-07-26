/**
 * Data hooks. When Supabase is configured they fetch real data; otherwise they
 * return mock data. Every hook refetches on screen focus (so any save is
 * reflected the moment you return to a screen — no reload) and also on an
 * explicit refresh bump (for same-screen updates).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { isSupabaseConfigured } from './supabase';
import { fetchTrips, fetchTrip, fetchVisitedPrefectureCodes, fetchPublicTrips } from './api';
import { subscribe } from './refresh';
import { trips as mockTrips, findTrip as mockFindTrip, publicTrips as mockPublicTrips, type Trip } from './mock';

export function useTrips(): { trips: Trip[]; loading: boolean } {
  const [trips, setTrips] = useState<Trip[]>(isSupabaseConfigured ? [] : mockTrips);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) return;
    fetchTrips()
      .then((t) => alive.current && setTrips(t.length ? t : mockTrips))
      .catch(() => alive.current && setTrips(mockTrips))
      .finally(() => alive.current && setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));
  useEffect(() => subscribe('trips', load), [load]);

  return { trips, loading };
}

/** 訪問済み都道府県コード(1..47)。実データのみ（初回オンボ＋自分の旅）。 */
export function useVisitedPrefectures(): { codes: number[]; loading: boolean } {
  const [codes, setCodes] = useState<number[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) return;
    fetchVisitedPrefectureCodes()
      .then((c) => alive.current && setCodes(c))
      .catch(() => alive.current && setCodes([]))
      .finally(() => alive.current && setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));
  useEffect(() => subscribe('visited', load), [load]);

  return { codes, loading };
}

export function usePublicTrips(): { trips: Trip[]; loading: boolean } {
  const [trips, setTrips] = useState<Trip[]>(isSupabaseConfigured ? [] : mockPublicTrips);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) return;
    fetchPublicTrips()
      .then((t) => alive.current && setTrips(t.length ? t : mockPublicTrips))
      .catch(() => alive.current && setTrips(mockPublicTrips))
      .finally(() => alive.current && setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));
  useEffect(() => subscribe('trips', load), [load]);

  return { trips, loading };
}

export function useTrip(id?: string): { trip: Trip | null; loading: boolean } {
  const [trip, setTrip] = useState<Trip | null>(isSupabaseConfigured ? null : mockFindTrip(id));
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setTrip(mockFindTrip(id)); return; }
    fetchTrip(id ?? '')
      .then((t) => alive.current && setTrip(t ?? mockFindTrip(id)))
      .catch(() => alive.current && setTrip(mockFindTrip(id)))
      .finally(() => alive.current && setLoading(false));
  }, [id]);

  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));
  useEffect(() => subscribe('trips', load), [load]);

  return { trip, loading };
}
