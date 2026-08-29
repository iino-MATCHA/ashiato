/**
 * 管理コンソール用のデータ取得。
 * /admin は複数ページに分かれているので、取得結果はモジュール内に持って
 * ページ遷移のたびに叩き直さないようにする（明示的な reload() で更新）。
 */
import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured } from './supabase';
import {
  fetchMyAdminRole, fetchAdminStats, fetchAdminPeople, fetchAnalytics,
} from './api';

export interface AdminData {
  role: string | null | 'loading';
  stats: any | null;
  admins: { username: string; name: string; email: string; role: string; isOwner: boolean }[];
  analytics: Awaited<ReturnType<typeof fetchAnalytics>> | null;
}

const EMPTY: AdminData = { role: 'loading', stats: null, admins: [], analytics: null };
let cache: AdminData = EMPTY;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

async function loadAll(force: boolean) {
  if (!isSupabaseConfigured) {
    cache = { ...cache, role: null };
    emit();
    return;
  }
  if (inflight && !force) return inflight;
  inflight = (async () => {
    const role = await fetchMyAdminRole();
    if (!role) {
      cache = { ...EMPTY, role: null };
      emit();
      return;
    }
    const [stats, admins, analytics] = await Promise.all([
      fetchAdminStats(), fetchAdminPeople(), fetchAnalytics(),
    ]);
    cache = { role, stats, admins, analytics };
    emit();
  })().finally(() => { inflight = null; });
  return inflight;
}

export function useAdmin() {
  const [data, setData] = useState<AdminData>(cache);
  useEffect(() => {
    const l = () => setData({ ...cache });
    listeners.add(l);
    if (cache.role === 'loading') loadAll(false);
    return () => { listeners.delete(l); };
  }, []);
  const reload = useCallback(() => loadAll(true), []);
  return { ...data, reload };
}
