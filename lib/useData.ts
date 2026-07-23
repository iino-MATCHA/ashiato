/**
 * Data hooks. When Supabase is configured they fetch real data; otherwise they
 * return the mock data synchronously so the app keeps working with no backend.
 */
import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from './supabase';
import { fetchTrips, fetchTrip } from './api';
import { trips as mockTrips, findTrip as mockFindTrip, type Trip } from './mock';

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
