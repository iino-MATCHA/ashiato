/**
 * Data hooks. When Supabase is configured they fetch real data; otherwise they
 * return mock data. Every hook refetches on screen focus (so any save is
 * reflected the moment you return to a screen — no reload) and also on an
 * explicit refresh bump (for same-screen updates).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { isSupabaseConfigured } from './supabase';
import {
  fetchTrips, fetchTrip, fetchVisitedPrefectureCodes, fetchPublicTrips,
} from './api';
import { subscribe } from './refresh';
import { readCache, writeCache } from './localCache';
import { trips as mockTrips, findTrip as mockFindTrip, publicTrips as mockPublicTrips, type Trip } from './mock';

export function useTrips(): { trips: Trip[]; loading: boolean } {
  /**
   * 前回取れた一覧を最初のフレームから出す。
   * 電波が弱い場所では問い合わせが返るまで数十秒かかることがあり、
   * その間ずっと空の画面を見せることになるため。取り直せたら差し替える。
   */
  const cached = isSupabaseConfigured ? readCache<Trip[]>('trips') : null;
  const [trips, setTrips] = useState<Trip[]>(
    isSupabaseConfigured ? cached ?? [] : mockTrips
  );
  const [loading, setLoading] = useState(isSupabaseConfigured && !cached);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) return;
    // no mock fallback when connected — an empty list means "you have no trips yet"
    fetchTrips()
      .then((t) => {
        if (!alive.current) return;
        setTrips(t);
        writeCache('trips', t);
      })
      // 取れなかったときは前回の内容を残す（空にして「旅が無い」と嘘をつかない）
      .catch(() => {})
      .finally(() => alive.current && setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));
  useEffect(() => subscribe('trips', load), [load]);

  return { trips, loading };
}

/** 訪問済み都道府県コード(1..47)。実データのみ（初回オンボ＋自分の旅）。 */
export function useVisitedPrefectures(): { codes: number[]; loading: boolean } {
  const cached = isSupabaseConfigured ? readCache<number[]>('visited') : null;
  const [codes, setCodes] = useState<number[]>(cached ?? []);
  const [loading, setLoading] = useState(isSupabaseConfigured && !cached);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) return;
    fetchVisitedPrefectureCodes()
      .then((c) => {
        if (!alive.current) return;
        setCodes(c);
        writeCache('visited', c);
      })
      .catch(() => {})
      .finally(() => alive.current && setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));
  useEffect(() => subscribe('visited', load), [load]);

  return { codes, loading };
}

export function usePublicTrips(): { trips: Trip[]; loading: boolean } {
  const cached = isSupabaseConfigured ? readCache<Trip[]>('publicTrips') : null;
  const [trips, setTrips] = useState<Trip[]>(
    isSupabaseConfigured ? cached ?? [] : mockPublicTrips
  );
  const [loading, setLoading] = useState(isSupabaseConfigured && !cached);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) return;
    fetchPublicTrips()
      .then((t) => {
        if (!alive.current) return;
        setTrips(t);
        writeCache('publicTrips', t);
      })
      .catch(() => {})
      .finally(() => alive.current && setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));
  useEffect(() => subscribe('trips', load), [load]);

  return { trips, loading };
}


export function useTrip(id?: string): { trip: Trip | null; loading: boolean } {
  // 一覧を見てから開くのが普通なので、そのキャッシュから先に出せる
  const cached = isSupabaseConfigured && id
    ? [...(readCache<Trip[]>('trips') ?? []), ...(readCache<Trip[]>('publicTrips') ?? [])]
        .find((t) => t.id === id) ?? null
    : null;
  const [trip, setTrip] = useState<Trip | null>(
    isSupabaseConfigured ? cached : mockFindTrip(id)
  );
  const [loading, setLoading] = useState(isSupabaseConfigured && !cached);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setTrip(mockFindTrip(id)); return; }
    fetchTrip(id ?? '')
      .then((t) => { if (alive.current && t) setTrip(t); })
      .catch(() => {})
      .finally(() => alive.current && setLoading(false));
  }, [id]);

  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));
  useEffect(() => subscribe('trips', load), [load]);

  return { trip, loading };
}
