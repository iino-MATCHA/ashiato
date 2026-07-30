import { useState } from 'react';
import { View, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { Splash } from '@/components/Splash';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

import { useI18n } from '@/lib/i18n';
/**
 * 認証から戻ってくる先。
 * apex(my-japan-matcha.com) は www へ 301 されるため、そのまま origin を渡すと
 * トークンを載せたURLが一度転送を挟む。確認メールのリンクも apex のまま届く。
 * 正規のホストへ揃えてから渡す。ローカルや他ドメインではその origin をそのまま使う。
 */
const CANONICAL = 'https://www.my-japan-matcha.com';
const redirectTo =
  typeof window === 'undefined'
    ? undefined
    : /(^|\.)my-japan-matcha\.com$/.test(window.location.hostname)
      ? CANONICAL
      : window.location.origin;

// show the intro only once per install
let splashShown = false;
function shouldSplash(): boolean {
  if (splashShown) return false;
  try {
    if (typeof localStorage !== 'undefined') {
      if (localStorage.getItem('ashiato_splash')) return false;
      localStorage.setItem('ashiato_splash', '1');
    }
  } catch {}
  splashShown = true;
  return true;
}

export default function Login() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const [splash, setSplash] = useState(shouldSplash);
  // SignInPrompt から「アカウントを作る」で来たときは新規登録で開く
  const { signup } = useLocalSearchParams<{ signup?: string }>();
  const [mode, setMode] = useState<'signin' | 'signup'>(signup === '1' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const goMock = () => router.replace('/(auth)/prefectures');

  const google = async () => {
    if (!isSupabaseConfigured) return goMock();
    setError(null);
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      // browser redirects to Google, then back to '/', where the auth gate takes over
    } catch (e: any) {
      setError(e?.message ?? 'Google sign-in failed');
    }
  };

  const submit = async () => {
    if (!isSupabaseConfigured) return goMock();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice('Check your inbox and tap the confirmation link — it opens the app automatically.');
          setMode('signin');
          setBusy(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
      router.replace('/'); // auth gate → prefecture onboarding (first time) or map
    } catch (e: any) {
      setError(typeof e?.message === 'string' && e.message ? e.message : 'Sign-in failed. Please check your email and password.');
    } finally {
      setBusy(false);
    }
  };

  if (splash) return <Splash onDone={() => setSplash(false)} />;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.washi }]}>
      {/* Brand */}
      <View style={styles.hero}>
        <AppText style={styles.brand} tone="ink">My Japan</AppText>
        <Gap h={space.md} />
        <AppText variant="body" tone="inkSoft" center style={{ maxWidth: 280 }}>
          Where you walk becomes a map.{'\n'}Where you visit, a stamp is earned.
        </AppText>
      </View>

      {/* Centered auth card */}
      <View style={styles.card}>
        <Pressable onPress={google} style={({ pressed }) => [styles.google, { borderColor: palette.ruleStrong }, pressed && { opacity: 0.6 }]}>
          <Ionicons name="logo-google" size={18} color={palette.ink} />
          <AppText variant="bodyStrong" tone="ink">{t('login.google')}</AppText>
        </Pressable>

        <Row style={{ alignItems: 'center', gap: space.sm, marginVertical: space.md }}>
          <Rule style={{ flex: 1 }} />
          <AppText variant="small" tone="inkFaint">or</AppText>
          <Rule style={{ flex: 1 }} />
        </Row>

        <TextInput
          value={email} onChangeText={setEmail}
          placeholder={t('login.email')} placeholderTextColor={palette.inkFaint}
          autoCapitalize="none" keyboardType="email-address"
          style={[styles.input, { color: palette.ink, borderColor: palette.ruleStrong }]}
        />
        <Gap h={space.sm} />
        <TextInput
          value={password} onChangeText={setPassword}
          placeholder={t('login.password')} placeholderTextColor={palette.inkFaint}
          secureTextEntry
          style={[styles.input, { color: palette.ink, borderColor: palette.ruleStrong }]}
        />

        {!!notice && (<><Gap h={space.sm} /><AppText variant="small" tone="matcha" center>{notice}</AppText></>)}
        {!!error && (<><Gap h={space.sm} /><AppText variant="small" tone="shu" center>{error}</AppText></>)}

        <Gap h={space.md} />
        <Pressable onPress={submit} disabled={busy} style={({ pressed }) => [styles.primary, { backgroundColor: palette.matcha }, pressed && { opacity: 0.85 }]}>
          <AppText variant="bodyStrong" style={{ color: '#fff' }}>{busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}</AppText>
        </Pressable>

        <Gap h={space.md} />
        <Pressable onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setNotice(null); }}>
          <AppText variant="small" tone="ai" center>
            {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
          </AppText>
        </Pressable>
      </View>

      <View style={{ height: space.xl }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.lg, justifyContent: 'center', alignItems: 'center' },
  hero: { alignItems: 'center', marginBottom: space.xl },
  brand: { fontFamily: fonts.minchoBold, fontSize: 48, lineHeight: 58, letterSpacing: 1 },
  card: { width: '100%', maxWidth: 340, alignSelf: 'center' },
  google: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, borderWidth: hairline * 2, borderRadius: 10, paddingVertical: 13 },
  input: { borderBottomWidth: hairline * 2, paddingVertical: 12, fontFamily: fonts.gothicRegular, fontSize: type.body },
  primary: { height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
