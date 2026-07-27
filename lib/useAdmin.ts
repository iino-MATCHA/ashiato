/**
 * 管理コンソール用のデータ取得。
 * /admin は複数ページに分かれているので、取得結果はモジュール内に持って
 * ページ遷移のたびに叩き直さないようにする（明示的な reload() で更新）。
 */
import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured } from './supabase';
import { fetchMyAdminRole, fetchAdminStats, fetchAdminOrders, fetchAdmins, fetchAnalytics } from './api';

export interface AdminData {
  role: string | null | 'loading';
  stats: any | null;
  orders: any[] | null;
  admins: { username: string; name: string; role: string }[];
  analytics: Awaited<ReturnType<typeof fetchAnalytics>> | null;
}

let cache: AdminData = { role: 'loading', stats: null, orders: null, admins: [], analytics: null };
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
      cache = { role: null, stats: null, orders: null, admins: [], analytics: null };
      emit();
      return;
    }
    const [stats, orders, admins, analytics] = await Promise.all([
      fetchAdminStats(), fetchAdminOrders(), fetchAdmins(), fetchAnalytics(),
    ]);
    cache = { role, stats, orders, admins, analytics };
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
