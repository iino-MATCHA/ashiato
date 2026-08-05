import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ensureProfile, fetchUserPrefectures, saveVisitedPrefectures } from '@/lib/api';
import { useTheme } from '@/lib/useTheme';
import { Landing } from '@/components/Landing';
import { peekHandoff, clearHandoff } from '@/lib/quiz/handoff';
import { funnel } from '@/lib/quiz/funnel';

/** 作られたばかりのアカウントか（登録完了として数えてよいか）の目安 */
const JUST_SIGNED_UP_MS = 15 * 60 * 1000;

/**
 * Auth gate. After an email-confirmation or Google redirect the session is
 * parsed from the URL, so a logged-in user lands straight in the app. First-time
 * users (no recorded prefectures) go through the prefecture onboarding.
 *
 * 診断LP(/quiz)から来た人だけは別扱い。**都道府県をもう一度選ばせない。**
 * 診断の途中で47県から選んでもらった分をここで保存して、選択画面を飛ばす。
 * ここが「診断 → 訪問済みデータ → 登録 → そのまま地図へ」の継ぎ目。
 */
export default function Index() {
  const { palette } = useTheme();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isSupabaseConfigured) {
        if (alive) setTarget('landing');
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // 未ログインはLPへ（ログイン画面に直行させない）
        if (alive) setTarget('landing');
        return;
      }
      await ensureProfile();
      let prefs = await fetchUserPrefectures();

      /**
       * 診断からの引き継ぎ。
       * すでに持っている県と足し合わせて保存する（上書きしない ―― ログイン済みの
       * 人が診断をやり直したときに、元の記録を消してしまわないため）。
       */
      const handoff = peekHandoff();
      if (handoff) {
        if (handoff.codes.length) {
          const merged = Array.from(new Set([...prefs, ...handoff.codes]));
          if (await saveVisitedPrefectures(merged)) prefs = merged;
        }
        clearHandoff();

        // 登録完了。既存ユーザーのログインを新規登録として数えないよう、
        // アカウントが作られた時刻を見る
        const user = data.session.user;
        const created = user.created_at ? new Date(user.created_at).getTime() : 0;
        if (created && Date.now() - created < JUST_SIGNED_UP_MS) {
          const method = (user.app_metadata as any)?.provider ?? 'email';
          funnel.signUpComplete(method, true, prefs.length);
        }
        // 診断で聞いた以上、選択画面は出さない
        if (alive) setTarget('/(tabs)/map');
        return;
      }

      if (alive) setTarget(prefs.length > 0 ? '/(tabs)/map' : '/(auth)/prefectures');
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.washi }}>
        <ActivityIndicator color={palette.matcha} />
      </View>
    );
  }
  if (target === 'landing') return <Landing />;
  return <Redirect href={target as any} />;
}
