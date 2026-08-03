/**
 * 招待リンクで来た人が、その場で登録してバディーになるためのモーダル。
 *
 * 画面を移さない。旅を見ている流れのまま登録し、終わったら
 * そのまま写真を足せる状態に変わる。ログイン画面へ飛ばすと、
 * 何に誘われて何をしようとしていたのかが途切れる。
 *
 * 登録が済んだら合鍵でバディーに入れる（trip_join_by_invite）。
 * 呼ぶ側は onJoined で旅を読み直すこと。
 */
import { useState } from 'react';
import { View, Modal, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Gap, Button, Row, Rule } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { joinTripByInvite } from '@/lib/api';
import { passwordProblem } from '@/lib/password';
import { track } from '@/lib/analytics';

export function InviteJoin({
  visible,
  token,
  tripTitle,
  onClose,
  onJoined,
}: {
  visible: boolean;
  /** 招待リンクの合鍵 */
  token: string;
  tripTitle?: string;
  onClose: () => void;
  /** 登録とバディー登録が済んだあと。旅を読み直す */
  onJoined: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const bad = passwordProblem(password);
        if (bad) { setError(t(bad)); setBusy(false); return; }
        const { data, error: e } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          // 確認メールから戻ってきたときも、招待リンクの続きに着地させる
          options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.href : undefined },
        });
        if (e) throw e;
        track('sign_up', { method: 'invite' });
        /**
         * メール確認が要る設定だと、この時点ではまだ入れない。
         * リンクを踏めば同じ場所に戻ってくるので、そう伝えて閉じない。
         */
        if (!data.session) {
          setNotice(t('invite.checkInbox'));
          setBusy(false);
          return;
        }
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (e) throw e;
      }

      const joined = await joinTripByInvite(token);
      setBusy(false);
      if (!joined) { setError(t('invite.joinFailed')); return; }
      track('invite_joined');
      onJoined();
    } catch (err: any) {
      setBusy(false);
      setError(typeof err?.message === 'string' && err.message ? err.message : t('invite.joinFailed'));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: palette.paper, borderColor: palette.rule }]}
          onPress={() => {}}
        >
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="footsteps-outline" size={34} color={palette.matcha} />
            <Gap h={space.md} />
            <AppText style={[styles.title, { color: palette.ink }]} center>
              {t('invite.joinTitle')}
            </AppText>
            <Gap h={space.sm} />
            <AppText variant="small" tone="ink" center style={{ lineHeight: 21, opacity: 0.86 }}>
              {tripTitle ? t('invite.joinBodyTrip', { title: tripTitle }) : t('invite.joinBody')}
            </AppText>
          </View>

          <Gap h={space.lg} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('login.email')}
            placeholderTextColor={palette.inkFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, { color: palette.ink, borderColor: palette.ruleStrong }]}
          />
          <Gap h={space.sm} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('login.password')}
            placeholderTextColor={palette.inkFaint}
            secureTextEntry
            style={[styles.input, { color: palette.ink, borderColor: palette.ruleStrong }]}
          />
          {mode === 'signup' && (
            <>
              <Gap h={space.sm} />
              <AppText variant="small" tone="inkFaint">{t('password.rule')}</AppText>
            </>
          )}

          {!!notice && (<><Gap h={space.sm} /><AppText variant="small" tone="matcha" center>{notice}</AppText></>)}
          {!!error && (<><Gap h={space.sm} /><AppText variant="small" tone="shu" center>{error}</AppText></>)}

          <Gap h={space.lg} />
          {busy ? (
            <ActivityIndicator color={palette.matcha} />
          ) : (
            <Button
              label={t(mode === 'signup' ? 'invite.joinCta' : 'login.signIn')}
              tone="matcha"
              onPress={submit}
            />
          )}

          <Gap h={space.sm} />
          <Button
            label={t(mode === 'signup' ? 'common.signin' : 'guest.signUp')}
            tone="ink"
            variant="outline"
            onPress={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null); setNotice(null); }}
          />

          <Gap h={space.md} />
          <Pressable onPress={onClose} hitSlop={8}>
            <AppText variant="small" tone="inkFaint" center>{t('guest.keepLooking')}</AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * 見た目は SignInPrompt（ゲストが保存を押したときの窓）と揃える。
 * 同じ「登録してください」の場面で別の顔が出ると、同じアプリに見えない。
 */
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  sheet: {
    width: '100%', maxWidth: 360, borderRadius: 18, padding: space.lg, borderWidth: hairline,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
  title: { fontFamily: fonts.minchoBold, fontSize: 24, lineHeight: 33 },
  input: {
    height: 46,
    borderWidth: hairline * 2,
    borderRadius: 10,
    paddingHorizontal: space.md,
    fontFamily: fonts.gothicRegular,
    fontSize: type.body,
  },
});
