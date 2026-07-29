/**
 * ログインしているかどうか。
 *
 * ゲスト（未ログイン）でもアプリの中を見られるようにしたので、
 * 「見せる」と「保存する」を分ける判定が各画面で必要になった。
 * ここが唯一の入口。
 *
 * セッションは localStorage / SecureStore に残っているので、
 * 判定は通信なしで済む（getSession はローカル読み取り）。
 * サインイン・サインアウトを跨いでも追随するよう、変化も購読する。
 */
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

/** null = まだ分からない（読み込み中） */
export type SessionState = boolean | null;

let cached: SessionState = isSupabaseConfigured ? null : true;
const listeners = new Set<() => void>();
let watching = false;

function set(next: SessionState) {
  if (cached === next) return;
  cached = next;
  listeners.forEach((l) => l());
}

function startWatching() {
  if (watching || !isSupabaseConfigured) return;
  watching = true;
  supabase.auth.getSession().then(({ data }) => set(!!data.session));
  supabase.auth.onAuthStateChange((_event, session) => set(!!session));
}

export function useSession(): { signedIn: SessionState; guest: boolean } {
  const [signedIn, setSignedIn] = useState<SessionState>(cached);
  useEffect(() => {
    const l = () => setSignedIn(cached);
    listeners.add(l);
    startWatching();
    l();
    return () => { listeners.delete(l); };
  }, []);
  // 読み込み中を「ゲスト」と決めつけない（一瞬ログインを促す画面が出てしまう）
  return { signedIn, guest: signedIn === false };
}
