/**
 * 旅のバディーを選ぶ画面。
 *
 * 友だちの中から検索して足す。ここに来る前に友だちでない人は出さない
 * （知らない人をいきなり旅に入れられるようにはしない）。
 * 選択は画面の中だけで持ち、右上の「保存」で一度に書き込む。
 * 以前は押した瞬間に書き込んでいたが、保存の手応えが無く
 * 「保存ボタンが無い」と迷わせていた。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Image, Pressable, StyleSheet, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchFriends, fetchTripBuddies, setTripBuddies, type UserSummary } from '@/lib/api';
import { shareInvite, inviteUrl } from '@/lib/invite';
import { useI18n } from '@/lib/i18n';

export default function TripBuddies() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  /** 開いた時点のバディー。保存が要るかの比較に使う */
  const [saved, setSaved] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const alive = useRef(true);
  /**
   * 招待リンクは先に取っておく。共有シートは押した流れの中でしか開けず、
   * 押してから合鍵を取りに行くと流れが切れてシートが出ない。
   */
  const [link, setLink] = useState<string | null>(null);
  useEffect(() => { if (id) inviteUrl(id).then(setLink).catch(() => {}); }, [id]);

  useEffect(() => {
    alive.current = true;
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([fetchFriends(), id ? fetchTripBuddies(id) : Promise.resolve([])])
      .then(([f, b]) => {
        if (!alive.current) return;
        setFriends(f);
        setChosen(b.map((x) => x.id));
        setSaved(b.map((x) => x.id));
      })
      .catch(() => {})
      .finally(() => alive.current && setLoading(false));
    return () => { alive.current = false; };
  }, [id]);

  /** 押した時点では画面の中だけ。書き込みは「保存」で行う */
  const toggle = useCallback((uid: string) => {
    setChosen((cur) => (cur.includes(uid) ? cur.filter((x) => x !== uid) : [...cur, uid]));
  }, []);

  const dirty =
    chosen.length !== saved.length || chosen.some((x) => !saved.includes(x));

  const save = useCallback(async () => {
    if (!id || saving) return;
    setSaving(true);
    const ok = await setTripBuddies(id, chosen).catch(() => false);
    if (!alive.current) return;
    setSaving(false);
    if (ok) {
      setSaved(chosen);
      router.back();
    }
  }, [id, chosen, saving]);

  const term = q.trim().toLowerCase();
  const list = term
    ? friends.filter((f) => `${f.name} ${f.username}`.toLowerCase().includes(term))
    : friends;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header
        title={t('buddy.editTitle')}
        right={
          <Pressable onPress={save} disabled={!dirty || saving} hitSlop={10}>
            <AppText
              variant="bodyStrong"
              tone={dirty && !saving ? 'matcha' : 'inkFaint'}
            >
              {saving ? t('common.saving') : t('common.save')}
            </AppText>
          </Pressable>
        }
      />
      <Rule />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled">
        <Gap h={space.lg} />
        <AppText variant="small" tone="inkFaint" style={{ lineHeight: 20 }}>{t('buddy.pickLead')}</AppText>
        <Gap h={space.md} />
        {/* 友だちにまだ居ない人は、ここから誘う */}
        <Pressable onPress={() => shareInvite(undefined, link ?? undefined)} hitSlop={8}>
          <Row style={{ gap: 5, alignItems: 'center' }}>
            <Ionicons name="paper-plane-outline" size={14} color={palette.matcha} />
            <AppText variant="small" tone="matcha">{t('buddy.invite')}</AppText>
          </Row>
        </Pressable>

        <Gap h={space.lg} />
        <Row style={[styles.search, { borderColor: palette.ruleStrong }]}>
          <Ionicons name="search" size={18} color={palette.inkFaint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('friends.searchPh')}
            placeholderTextColor={palette.inkFaint}
            style={[styles.searchInput, { color: palette.ink }]}
            autoCapitalize="none"
          />
        </Row>

        <Gap h={space.xl} />
        {loading ? (
          <ActivityIndicator color={palette.matcha} />
        ) : friends.length === 0 ? (
          <>
            <AppText variant="small" tone="inkFaint" style={{ lineHeight: 20 }}>{t('buddy.none')}</AppText>
          </>
        ) : (
          <>
            {/**
             * バディーと、まだバディーでない友だちを分けて出す。
             * ひとつの一覧に混ぜると、友だち全員がこの旅のバディーに
             * 見えてしまう（指摘を受けた）。上が「この旅のバディー」、
             * 下が「友だちから足す」
             */}
            {(() => {
              const buddies = list.filter((u) => chosen.includes(u.id));
              const others = list.filter((u) => !chosen.includes(u.id));
              const row = (u: UserSummary, on: boolean) => (
                <View key={u.id}>
                  <Pressable onPress={() => toggle(u.id)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                    <Row style={styles.row}>
                      <View style={[styles.avatar, { backgroundColor: palette.fill }]}>
                        {u.avatarUrl ? (
                          <Image source={{ uri: u.avatarUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
                        ) : (
                          <Ionicons name="person" size={20} color={palette.matcha} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyStrong" tone="ink">{u.name}</AppText>
                        <AppText variant="small" tone="inkFaint">@{u.username}</AppText>
                      </View>
                      <Ionicons
                        name={on ? 'checkmark-circle' : 'add-circle-outline'}
                        size={24}
                        color={on ? palette.matcha : palette.ruleStrong}
                      />
                    </Row>
                  </Pressable>
                  <Rule />
                </View>
              );
              return (
                <>
                  <Eyebrow tone="matcha">{t('buddy.current')}</Eyebrow>
                  <Gap h={space.md} />
                  <Rule />
                  {buddies.length ? (
                    buddies.map((u) => row(u, true))
                  ) : (
                    <><Gap h={space.sm} /><AppText variant="small" tone="inkFaint">—</AppText><Gap h={space.sm} /><Rule /></>
                  )}
                  <Gap h={space.xl} />
                  <Eyebrow>{t('buddy.addFrom')}</Eyebrow>
                  <Gap h={space.md} />
                  <Rule />
                  {others.map((u) => row(u, false))}
                </>
              );
            })()}
            {term !== '' && list.length === 0 && (
              <><Gap h={space.md} /><AppText variant="small" tone="inkFaint">{t('friends.noneFound', { q: q.trim() })}</AppText></>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', gap: space.sm, borderBottomWidth: hairline * 2, paddingBottom: space.sm },
  searchInput: { flex: 1, fontFamily: fonts.gothicRegular, fontSize: type.body, paddingVertical: 4, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
