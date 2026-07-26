/**
 * Data hooks. When Supabase is configured they fetch real data; otherwise they
 * return the mock data synchronously so the app keeps working with no backend.
 */
import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from './supabase';
import { fetchTrips, fetchTrip, fetchVisitedPrefectureCodes, fetchPublicTrips } from './api';
import { subscribe } from './refresh';
import { trips as mockTrips, findTrip as mockFindTrip, publicTrips as mockPublicTrips, type Trip } from './mock';

export function useTrips(): { trips: Trip[]; loading: boolean } {
  const [trips, setTrips] = useState<Trip[]>(isSupabaseConfigured ? [] : mockTrips);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    const load = () => {
      fetchTrips()
        .then((t) => alive && setTrips(t.length ? t : mockTrips))
        .catch(() => alive && setTrips(mockTrips))
        .finally(() => alive && setLoading(false));
    };
    load();
    const unsub = subscribe('trips', load);
    return () => { alive = false; unsub(); };
  }, []);

  return { trips, loading };
}

/** 訪問済み都道府県コード(1..47)。実データのみ（初回オンボ＋自分の旅）。モックは含めない。 */
export function useVisitedPrefectures(): { codes: number[]; loading: boolean } {
  const [codes, setCodes] = useState<number[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    const load = () => {
      fetchVisitedPrefectureCodes()
        .then((c) => alive && setCodes(c))
        .catch(() => alive && setCodes([]))
        .finally(() => alive && setLoading(false));
    };
    load();
    const unsub = subscribe('visited', load);
    return () => { alive = false; unsub(); };
  }, []);

  return { codes, loading };
}

export function usePublicTrips(): { trips: Trip[]; loading: boolean } {
  const [trips, setTrips] = useState<Trip[]>(isSupabaseConfigured ? [] : mockPublicTrips);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    fetchPublicTrips()
      .then((t) => alive && setTrips(t.length ? t : mockPublicTrips))
      .catch(() => alive && setTrips(mockPublicTrips))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);
  return { trips, loading };
}

export function useTrip(id?: string): { trip: Trip | null; loading: boolean } {
  const [trip, setTrip] = useState<Trip | null>(isSupabaseConfigured ? null : mockFindTrip(id));
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setTrip(mockFindTrip(id));
      return;
    }
    let alive = true;
    fetchTrip(id ?? '')
      .then((t) => alive && setTrip(t ?? mockFindTrip(id)))
      .catch(() => alive && setTrip(mockFindTrip(id)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  return { trip, loading };
}
