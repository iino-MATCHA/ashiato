import { useState } from 'react';
import { View, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Rule, Gap, Button } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function Login() {
  const { palette } = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goMock = () => router.replace('/(auth)/onboarding');

  const submit = async () => {
    if (!isSupabaseConfigured) return goMock();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        // ensure a profile row exists
        const uid = data.user?.id;
        if (uid) {
          const uname = email.trim().split('@')[0].slice(0, 20) || 'traveller';
          await supabase.from('profiles').upsert({ id: uid, username: uname, display_name: uname });
        }
        if (!data.session) {
          setError('Account created. If email confirmation is on, confirm then sign in.');
          setMode('signin');
          setBusy(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
      router.replace('/(tabs)/map');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.washi }]}>
      <View style={styles.top}>
        <AppText variant="eyebrow" tone="matcha">ASHIATO — TRACE YOUR JOURNEY ACROSS JAPAN</AppText>
        <Gap h={space.md} />
        <AppText style={styles.brand} tone="ink">足跡</AppText>
        <Gap h={space.md} />
        <AppText variant="h3" tone="inkSoft" style={{ maxWidth: 280 }}>
          Where you walk becomes a map.{'\n'}Where you visit, a stamp is earned.
        </AppText>
      </View>

      <View>
        {/* email auth */}
        <Rule />
        <Gap h={space.md} />
        <TextInput
          value={email} onChangeText={setEmail}
          placeholder="Email" placeholderTextColor={palette.inkFaint}
          autoCapitalize="none" keyboardType="email-address"
          style={[styles.input, { color: palette.ink, borderColor: palette.ruleStrong }]}
        />
        <Gap h={space.sm} />
        <TextInput
          value={password} onChangeText={setPassword}
          placeholder="Password" placeholderTextColor={palette.inkFaint}
          secureTextEntry
          style={[styles.input, { color: palette.ink, borderColor: palette.ruleStrong }]}
        />
        {error && (
          <>
            <Gap h={space.sm} />
            <AppText variant="small" tone="shu">{error}</AppText>
          </>
        )}
        <Gap h={space.md} />
        <Button
          label={busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          tone="matcha"
          onPress={submit}
          disabled={busy}
        />
        <Gap h={space.sm} />
        <Pressable onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}>
          <AppText variant="small" tone="ai" center>
            {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
          </AppText>
        </Pressable>

        {!isSupabaseConfigured && (
          <>
            <Gap h={space.md} />
            <Pressable onPress={goMock}>
              <AppText variant="small" tone="inkFaint" center>Continue in demo mode →</AppText>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.lg, paddingTop: space.xxl, paddingBottom: space.xl, justifyContent: 'space-between' },
  top: { flex: 1, justifyContent: 'center' },
  brand: { fontFamily: fonts.minchoBold, fontSize: 88, lineHeight: 96, letterSpacing: 4 },
  input: { borderWidth: hairline * 2, borderRadius: 8, paddingHorizontal: space.md, paddingVertical: 12, fontFamily: fonts.gothicRegular, fontSize: type.body },
});
