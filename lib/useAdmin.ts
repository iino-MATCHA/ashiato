/**
 * 管理コンソール用のデータ取得。
 * /admin は複数ページに分かれているので、取得結果はモジュール内に持って
 * ページ遷移のたびに叩き直さないようにする（明示的な reload() で更新）。
 */
import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured } from './supabase';
import {
  fetchMyAdminRole, fetchAdminStats, fetchAdminOrders, fetchAdmins, fetchAnalytics,
  fetchAdminNotifications, markAdminNotificationsRead, type AdminNotification,
} from './api';

export interface AdminData {
  role: string | null | 'loading';
  stats: any | null;
  orders: any[] | null;
  admins: { username: string; name: string; role: string }[];
  analytics: Awaited<ReturnType<typeof fetchAnalytics>> | null;
  /** 決済完了などの通知。新しい順。 */
  notifications: AdminNotification[];
}

const EMPTY: AdminData = { role: 'loading', stats: null, orders: null, admins: [], analytics: null, notifications: [] };
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
    const [stats, orders, admins, analytics, notifications] = await Promise.all([
      fetchAdminStats(), fetchAdminOrders(), fetchAdmins(), fetchAnalytics(), fetchAdminNotifications(),
    ]);
    cache = { role, stats, orders, admins, analytics, notifications };
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
  /** 既読にする（idを省くと未読すべて）。押した瞬間に画面へ反映してから取り直す。 */
  const markRead = useCallback(async (id?: string) => {
    const now = new Date().toISOString();
    cache = {
      ...cache,
      notifications: cache.notifications.map((n) =>
        (id ? n.id === id : true) && !n.readAt ? { ...n, readAt: now } : n
      ),
    };
    emit();
    await markAdminNotificationsRead(id);
    loadAll(true);
  }, []);
  return { ...data, reload, markRead };
}
