import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ensureProfile, fetchUserPrefectures } from '@/lib/api';
import { useTheme } from '@/lib/useTheme';
import { Landing } from '@/components/Landing';

/**
 * Auth gate. After an email-confirmation or Google redirect the session is
 * parsed from the URL, so a logged-in user lands straight in the app. First-time
 * users (no recorded prefectures) go through the prefecture onboarding.
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
      const prefs = await fetchUserPrefectures();
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
