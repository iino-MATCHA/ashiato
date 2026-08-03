import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

/**
 * Supabase クライアント。
 * 環境変数は app.json の extra か、EXPO_PUBLIC_ 系で注入する。
 * 未設定でもアプリが落ちないよう、空文字フォールバックを用意（MVPはモックデータで動作）。
 */
const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * 招待リンクの合鍵。
 *
 * リンクを受け取った人はまだアカウントを持っていないので、
 * 普通の権限では旅を読めない。合鍵を毎回の通信に載せて、
 * RLS 側（0024）にそれを照合させる。
 *
 * ここで差し込むのは、読み取りの問い合わせを書き換えないため。
 * assembleTrips は6本の問い合わせを投げており、招待のためだけに
 * それを丸ごと別経路にすると、二重に育てることになる。
 */
let inviteToken: string | null = null;
export function setInviteToken(token: string | null) {
  inviteToken = token && /^[0-9a-f-]{36}$/i.test(token) ? token : null;
}
export function currentInviteToken(): string | null {
  return inviteToken;
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // parse tokens from the URL after email-confirmation / Google OAuth redirects (web)
      detectSessionInUrl: typeof window !== 'undefined',
      flowType: 'implicit',
    },
    global: {
      fetch: (input: any, init: any = {}) => {
        if (!inviteToken) return fetch(input, init);
        const headers = new Headers(init.headers ?? {});
        headers.set('x-invite-token', inviteToken);
        return fetch(input, { ...init, headers });
      },
    },
  }
);
