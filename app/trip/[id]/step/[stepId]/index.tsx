import { useEffect, useState } from 'react';
import { View, Image, Pressable, ScrollView, TextInput, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrip } from '@/lib/useData';
import { useRippleNav } from '@/lib/transition';
import { useProfile } from '@/lib/useProfile';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchStepSocial, toggleLike, addComment, type StepSocial } from '@/lib/api';

import { useKeyboardInset, scrollInputIntoView } from '@/lib/useKeyboardInset';
import { useI18n } from '@/lib/i18n';
import { translateText } from '@/lib/translate';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useSession } from '@/lib/useSession';
import { transportLabel, type TransportMode } from '@/lib/mock';

const transportIcon: Record<TransportMode, any> = {
  car: 'car-outline', train: 'subway-outline', shinkansen: 'train-outline',
  plane: 'airplane-outline', walk: 'walk-outline', ferry: 'boat-outline', bus: 'bus-outline',
};

export default function StepDetail() {
  const { palette } = useTheme();
  const { width, height } = useWindowDimensions();
  const { id, stepId, readonly } = useLocalSearchParams<{ id: string; stepId: string; readonly?: string }>();
  const { trip } = useTrip(id);
  const { profile } = useProfile();
  const step = trip?.steps.find((s) => s.id === stepId);
  const { markReady } = useRippleNav();
  // 立ち寄り先の中身が出せた時点で、遷移の白い覆いを剥がしてよい
  useEffect(() => {
    if (step || trip) markReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!step, !!trip]);
  // バディーも持ち主と同じように直せる。canEdit が「持ち主か同行者か」を持っている
  const canEdit = (trip?.canEdit || trip?.authorId === 'me' || !trip?.authorId) && readonly !== '1';

  const [hero, setHero] = useState(0);
  // null にしない。取得前や取得失敗でも空の状態を持っておくことで、
  // 投稿した分をその場で足せる（＝必ず即時反映される）。
  const [social, setSocial] = useState<StepSocial>({ likes: 0, likedByMe: false, comments: [] });
  // ゲストは読める。いいね・コメントを押した瞬間に促す
  const { guest } = useSession();
  const [askSignIn, setAskSignIn] = useState<null | 'like' | 'comment'>(null);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const keyboardInset = useKeyboardInset();
  const { t, locale } = useI18n();
  // 翻訳された本文（null = 原文表示）
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const toggleTranslate = async () => {
    if (translated) { setTranslated(null); return; }
    if (!step?.note.trim()) return;
    setTranslating(true);
    const out = await translateText(step.note, locale);
    setTranslating(false);
    if (out) setTranslated(out);
  };

  const loadSocial = () => {
    if (!isSupabaseConfigured || !stepId) return;
    fetchStepSocial(stepId).then((fresh) => {
      // 自分が今書いた分がサーバー側の一覧にまだ無ければ残す
      setSocial((cur) => {
        const known = new Set(fresh.comments.map((c) => c.id));
        const mine = cur.comments.filter((c) => !known.has(c.id) && c.id.startsWith('local-'));
        return { ...fresh, comments: [...fresh.comments, ...mine] };
      });
    });
  };
  useEffect(loadSocial, [stepId]);

  if (!trip || !step) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">{t('common.loading')}</AppText>
      </SafeAreaView>
    );
  }

  const coverH = Math.min(height * 0.3, 240);

  const like = async () => {
    if (guest) return setAskSignIn('like');
    const prev = social;
    setMsg(null);
    setSocial({ ...social, likedByMe: !social.likedByMe, likes: social.likes + (social.likedByMe ? -1 : 1) });
    const ok = await toggleLike(step.id, trip.id, social.likedByMe);
    if (!ok) { setSocial(prev); setMsg(t('guest.why.like')); return; }
    loadSocial();
  };

  const post = async () => {
    if (guest) return setAskSignIn('comment');
    const body = draft.trim();
    if (!body || posting) return;
    setMsg(null);
    setPosting(true);
    const tempId = `local-${Date.now()}`;
    // まず画面に出す
    setSocial((cur) => ({
      ...cur,
      comments: [...cur.comments, { id: tempId, author: profile.name || 'You', body, createdAt: new Date().toISOString().slice(0, 10) }],
    }));
    setDraft('');

    const created = await addComment(step.id, trip.id, body);
    setPosting(false);
    if (!created) {
      // 失敗したら足した分を取り消して、書いた内容は入力欄に戻す
      setSocial((cur) => ({ ...cur, comments: cur.comments.filter((c) => c.id !== tempId) }));
      setDraft(body);
      setMsg(t('guest.why.comment'));
      return;
    }
    // 仮の行をサーバーが返した本物に差し替える（再取得の成否に依存しない）
    setSocial((cur) => ({
      ...cur,
      comments: cur.comments.map((c) =>
        c.id === tempId ? { ...created, author: profile.name || 'You' } : c
      ),
    }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header
        title={step.placeName}
        right={
          canEdit ? (
            /* 歯車だと「設定」に見えて編集に辿り着けない（ユーザー指摘）。言葉で出す */
            <Pressable
              onPress={() => router.push(`/trip/${trip.id}/step/${step.id}/edit`)}
              hitSlop={10}
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            >
              <AppText
                style={{
                  fontFamily: fonts.gothicMedium,
                  fontSize: 13,
                  color: palette.matcha,
                  textDecorationLine: 'underline',
                }}
              >
                {t('common.edit')}
              </AppText>
            </Pressable>
          ) : undefined
        }
      />
      <Rule />
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl + keyboardInset }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={{ uri: step.images[hero] }} style={{ width: '100%', height: coverH, borderRadius: 10, backgroundColor: palette.fill }} resizeMode="cover" />
        {step.images.length > 1 && (
          <Row style={{ gap: 6, marginTop: space.sm }}>
            {step.images.slice(0, 8).map((uri, i) => (
              <Pressable key={i} onPress={() => setHero(i)}>
                <Image source={{ uri }} style={[styles.thumb, { borderColor: i === hero ? palette.matcha : 'transparent' }]} resizeMode="cover" />
              </Pressable>
            ))}
          </Row>
        )}

        <Gap h={space.md} />
        <Row style={{ gap: 8, alignItems: 'center' }}>
          <View style={[styles.transport, { backgroundColor: palette.matcha }]}>
            <Ionicons name={transportIcon[step.transport]} size={13} color="#fff" />
            <AppText variant="small" style={{ color: '#fff' }}>{transportLabel[step.transport]}</AppText>
          </View>
          <AppText variant="small" tone="inkFaint">
            {step.loggedAt.replace(/-/g, '.')} · {t('orders.photosCount', { n: step.images.length })}
          </AppText>
        </Row>

        <Gap h={space.sm} />
        <Eyebrow tone="matcha">{step.prefectureName}</Eyebrow>
        <Gap h={4} />
        <AppText variant="h2" tone="ink">{step.title}</AppText>
        <AppText variant="small" tone="inkSoft">{step.placeName}</AppText>
        <Gap h={space.sm} />
        <AppText variant="body" tone="ink" style={{ lineHeight: 24 }}>
          {translated ?? step.note}
        </AppText>

        {/* 本文の機械翻訳（現在のUI言語へ）。原文に戻すトグルつき */}
        {!!step.note.trim() && (
          <>
            <Gap h={space.sm} />
            <Pressable onPress={toggleTranslate} disabled={translating} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
              <Row style={{ gap: 5, alignItems: 'center' }}>
                <Ionicons name="language-outline" size={15} color={palette.matcha} />
                <AppText variant="small" tone="matcha">
                  {translating ? t('common.translating') : translated ? t('common.showOriginal') : t('common.translate')}
                </AppText>
              </Row>
            </Pressable>
          </>
        )}

        {/* 自分（か同行者）の記録だけ、この地点をシェアできる。
            他人の記録で出すと、人の写真を自分の名前で配る形になる。
            編集はヘッダー右の歯車へ移した。 */}
        {canEdit && (
          <>
            <Gap h={space.lg} />
            <Button
              label={t('step.share')}
              tone="matcha"
              onPress={() => router.push(`/trip/${trip.id}/step/${step.id}/share`)}
            />
          </>
        )}

        {/* Likes + comments */}
        {isSupabaseConfigured && (
          <>
            <Gap h={space.xl} />
            <Rule />
            <Gap h={space.md} />
            <Row style={{ gap: space.lg, alignItems: 'center' }}>
              <Pressable onPress={like}>
                <Row style={{ gap: 6, alignItems: 'center' }}>
                  <Ionicons name={social?.likedByMe ? 'heart' : 'heart-outline'} size={22} color={social?.likedByMe ? palette.shu : palette.inkSoft} />
                  <AppText variant="bodyStrong" tone="ink">{social?.likes ?? 0}</AppText>
                </Row>
              </Pressable>
              <Row style={{ gap: 6, alignItems: 'center' }}>
                <Ionicons name="chatbubble-outline" size={20} color={palette.inkSoft} />
                <AppText variant="bodyStrong" tone="ink">{social?.comments.length ?? 0}</AppText>
              </Row>
            </Row>

            <Gap h={space.md} />
            {(social?.comments ?? []).map((c) => (
              <View key={c.id} style={{ marginBottom: space.md }}>
                <Row style={{ gap: 6, alignItems: 'baseline' }}>
                  <AppText variant="bodyStrong" tone="ink">{c.author}</AppText>
                  <AppText variant="small" tone="inkFaint">{c.createdAt}</AppText>
                </Row>
                <AppText variant="body" tone="inkSoft">{c.body}</AppText>
              </View>
            ))}
            {(social?.comments.length ?? 0) === 0 && (
              <AppText variant="small" tone="inkFaint">{t('step.beFirst')}</AppText>
            )}

            {!!msg && (<><Gap h={space.sm} /><AppText variant="small" tone="shu">{msg}</AppText></>)}

            <Gap h={space.md} />
            {/* send button is ABSOLUTELY positioned inside the bar — can never overflow */}
            <View style={[styles.commentBar, { borderColor: palette.ruleStrong }]}>
              <TextInput
                value={draft} onChangeText={setDraft}
                placeholder={t('step.commentPh')} placeholderTextColor={palette.inkFaint}
                style={[styles.commentInput, { color: palette.ink }]}
                onSubmitEditing={post}
                onFocus={() => scrollInputIntoView()}
                returnKeyType="send"
                blurOnSubmit={false}
                multiline={false}
              />
              <Pressable onPress={post} disabled={posting || !draft.trim()} style={[styles.sendBtn, { backgroundColor: draft.trim() ? palette.matcha : palette.fill }]}>
                <Ionicons name="arrow-up" size={18} color={draft.trim() ? '#fff' : palette.inkFaint} />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
      <SignInPrompt visible={askSignIn !== null} onClose={() => setAskSignIn(null)} reason={askSignIn ?? 'save'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 44, height: 44, borderRadius: 6, borderWidth: 2, backgroundColor: '#eee' },
  transport: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  commentBar: { position: 'relative', width: '100%', height: 46, borderWidth: hairline * 2, borderRadius: 23, justifyContent: 'center' },
  // 高さいっぱいに広げて、バーのどこを触っても入力欄にフォーカスが入るようにする。
  // フォントは16px以上（iOS Safari が小さいと勝手に拡大してしまう）。
  commentInput: { flex: 1, height: '100%', fontFamily: fonts.gothicRegular, fontSize: Math.max(16, type.body), paddingLeft: space.md, paddingRight: 52, minWidth: 0 },
  sendBtn: { position: 'absolute', right: 5, top: 5, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
