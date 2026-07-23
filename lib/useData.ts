/**
 * Data hooks. When Supabase is configured they fetch real data; otherwise they
 * return the mock data synchronously so the app keeps working with no backend.
 */
import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from './supabase';
import { fetchTrips, fetchTrip, fetchVisitedPrefectureCodes } from './api';
import { trips as mockTrips, findTrip as mockFindTrip, goshuinList, type Trip } from './mock';
import { PREFECTURE_ID_BY_SLUG, slugForName } from './prefectures';

export function useTrips(): { trips: Trip[]; loading: boolean } {
  const [trips, setTrips] = useState<Trip[]>(isSupabaseConfigured ? [] : mockTrips);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    fetchTrips()
      .then((t) => alive && setTrips(t.length ? t : mockTrips))
      .catch(() => alive && setTrips(mockTrips))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { trips, loading };
}

/** 訪問済み都道府県コード(1..47)。Supabaseは RPC、未設定はモック（旅＋獲得御朱印から算出）。 */
export function useVisitedPrefectures(): { codes: number[]; loading: boolean } {
  const mockCodes = () => {
    const names = [
      ...mockTrips.flatMap((t) => t.prefectures),
      ...goshuinList.filter((g) => g.acquired).map((g) => g.prefectureName),
    ];
    const set = new Set<number>();
    names.forEach((n) => {
      const id = PREFECTURE_ID_BY_SLUG[slugForName(n)];
      if (id) set.add(id);
    });
    return Array.from(set);
  };
  const [codes, setCodes] = useState<number[]>(isSupabaseConfigured ? [] : mockCodes());
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    fetchVisitedPrefectureCodes()
      .then((c) => alive && setCodes(c.length ? c : mockCodes()))
      .catch(() => alive && setCodes(mockCodes()))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { codes, loading };
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
