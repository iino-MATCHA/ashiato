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
  fetchCart, fetchMyOrders, type CartItem, type OrderRow,
} from './api';
import { subscribe } from './refresh';
import { trips as mockTrips, findTrip as mockFindTrip, publicTrips as mockPublicTrips, type Trip } from './mock';

export function useTrips(): { trips: Trip[]; loading: boolean } {
  const [trips, setTrips] = useState<Trip[]>(isSupabaseConfigured ? [] : mockTrips);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) return;
    // no mock fallback when connected — an empty list means "you have no trips yet"
    fetchTrips()
      .then((t) => alive.current && setTrips(t))
      .catch(() => alive.current && setTrips([]))
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
      .then((t) => alive.current && setTrips(t))
      .catch(() => alive.current && setTrips([]))
      .finally(() => alive.current && setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));
  useEffect(() => subscribe('trips', load), [load]);

  return { trips, loading };
}

/** 購入かご。かごへ入れる/外すたびに bump('cart') で即座に描き直る。 */
export function useCart(): { items: CartItem[]; loading: boolean } {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    fetchCart()
      .then((c) => alive.current && setItems(c))
      .catch(() => alive.current && setItems([]))
      .finally(() => alive.current && setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));
  useEffect(() => subscribe('cart', load), [load]);

  return { items, loading };
}

/** 自分の注文（印刷版）。 */
export function useOrders(): { orders: OrderRow[]; loading: boolean } {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    fetchMyOrders()
      .then((o) => alive.current && setOrders(o))
      .catch(() => alive.current && setOrders([]))
      .finally(() => alive.current && setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));
  useEffect(() => subscribe('orders', load), [load]);

  return { orders, loading };
}

export function useTrip(id?: string): { trip: Trip | null; loading: boolean } {
  const [trip, setTrip] = useState<Trip | null>(isSupabaseConfigured ? null : mockFindTrip(id));
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setTrip(mockFindTrip(id)); return; }
    fetchTrip(id ?? '')
      .then((t) => alive.current && setTrip(t))
      .catch(() => alive.current && setTrip(null))
      .finally(() => alive.current && setLoading(false));
  }, [id]);

  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));
  useEffect(() => subscribe('trips', load), [load]);

  return { trip, loading };
}
