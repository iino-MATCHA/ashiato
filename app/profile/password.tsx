/**
 * パスワードの変更。
 * いま使っているパスワードで一度サインインし直してから更新する。
 * （セッションが残っているだけで変更できてしまうと、端末を借りられたときに危ない）
 */
import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText, Gap } from '@/components/ui';
import { Header } from '@/components/Header';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { passwordProblem } from '@/lib/password';
import { useI18n } from '@/lib/i18n';

export default function ChangePassword() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(null);
    if (next !== again) return setError(t('password.mismatch'));
    const bad = passwordProblem(next);
    if (bad) return setError(t(bad));
    if (!isSupabaseConfigured) return setError(t('password.failed'));

    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const email = u.user?.email;
      if (!email) throw new Error(t('password.failed'));
      // 本人確認。今のパスワードが違えばここで止まる
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: current });
      if (signInErr) throw new Error(t('password.wrongCurrent'));
      const { error: upErr } = await supabase.auth.updateUser({ password: next });
      if (upErr) throw upErr;
      setDone(true);
      setCurrent(''); setNext(''); setAgain('');
    } catch (e: any) {
      setError(typeof e?.message === 'string' && e.message ? e.message : t('password.failed'));
    } finally {
      setBusy(false);
    }
  };

  const input = [styles.input, { color: palette.ink, borderColor: palette.ruleStrong }];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top']}>
      <Header title={t('password.title')} />
      <ScrollView contentContainerStyle={{ padding: space.lg }} keyboardShouldPersistTaps="handled">
        <AppText variant="small" tone="inkSoft" style={{ lineHeight: 21 }}>{t('password.rule')}</AppText>
        <Gap h={space.lg} />

        <AppText variant="small" tone="inkFaint">{t('password.current')}</AppText>
        <TextInput value={current} onChangeText={setCurrent} secureTextEntry autoCapitalize="none" style={input} />
        <Gap h={space.md} />
        <AppText variant="small" tone="inkFaint">{t('password.next')}</AppText>
        <TextInput value={next} onChangeText={setNext} secureTextEntry autoCapitalize="none" style={input} />
        <Gap h={space.md} />
        <AppText variant="small" tone="inkFaint">{t('password.again')}</AppText>
        <TextInput value={again} onChangeText={setAgain} secureTextEntry autoCapitalize="none" style={input} />

        {!!error && (<><Gap h={space.md} /><AppText variant="small" tone="shu">{error}</AppText></>)}
        {done && (<><Gap h={space.md} /><AppText variant="small" tone="matcha">{t('password.done')}</AppText></>)}

        <Gap h={space.xl} />
        <Pressable
          onPress={submit}
          disabled={busy}
          style={({ pressed }) => [styles.primary, { backgroundColor: palette.matcha }, (pressed || busy) && { opacity: 0.85 }]}
        >
          <AppText variant="bodyStrong" style={{ color: '#fff' }}>{busy ? '…' : t('password.save')}</AppText>
        </Pressable>
        <View style={{ height: space.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 説明ではなく入力欄なので、下線だけの箱で受ける
  input: { borderBottomWidth: hairline * 2, paddingVertical: 12, fontFamily: fonts.gothicRegular, fontSize: type.body },
  primary: { height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
