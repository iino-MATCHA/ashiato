/**
 * /map の日本地図で県をタップしたときのカード。
 *
 * **記録が先、情報があと。** このアプリの主は旅の記録なので、
 * その県での「あなたの記録」を最上段に、次に「みんなの旅」、
 * その下に県の紹介と MATCHA への導線を置く（ユーザー指定の並び）。
 * 記録だけなら Polarsteps にもできる ―― 記録の下に編集部の中身が
 * 続くことが、この地図の独自性になる。
 *
 * 出し方はランク表(CoverageGauge)と同じ Modal。画面下から立ち上がり、
 * 背景タップで閉じる。箱では囲まず、段は罫線(Rule)で区切る。
 */
import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { SignInPrompt } from '@/components/SignInPrompt';
import { space, fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n, localizeMatchaUrl } from '@/lib/i18n';
import { useTrips, usePublicTrips } from '@/lib/useData';
import { useSession } from '@/lib/useSession';
import {
  PREFECTURE_EN_BY_ID, PREFECTURE_SLUG_BY_ID, prefectureName, prefectureMatchaUrl, slugForName,
} from '@/lib/prefectures';
import { prefectureDescription } from '@/lib/quiz/descriptions';
import { photoFor } from '@/lib/quiz/photos';
import { searchTourismAreas, type TourismArea } from '@/lib/api';
import type { Trip } from '@/lib/mock';
import type { Locale } from '@/lib/i18n';

export function PrefectureSheet({ code, onClose }: { code: number | null; onClose: () => void }) {
  const { palette } = useTheme();
  const { t, locale } = useI18n();
  const { height } = useWindowDimensions();
  const { guest } = useSession();
  const { trips } = useTrips();
  const { trips: publicTrips } = usePublicTrips();
  const [areas, setAreas] = useState<TourismArea[]>([]);
  const [askSignIn, setAskSignIn] = useState(false);

  const slug = code ? PREFECTURE_SLUG_BY_ID[code] : null;
  const inPref = (trip: Trip) =>
    trip.steps.some((s) => slugForName(s.prefectureName ?? '') === slug);

  /** その県に立ち寄りのある自分の旅と、そこでの記録の量 */
  const mine = useMemo(() => (slug ? trips.filter(inPref) : []), [trips, slug]);
  const stats = useMemo(() => {
    let stops = 0;
    let photos = 0;
    mine.forEach((trip) =>
      trip.steps.forEach((s) => {
        if (slugForName(s.prefectureName ?? '') !== slug) return;
        stops += 1;
        photos += s.images.filter(Boolean).length;
      })
    );
    return { stops, photos };
  }, [mine, slug]);

  /** みんなの旅。自分の一覧に既にあるものは重ねて出さない */
  const others = useMemo(
    () => (slug ? publicTrips.filter(inPref).filter((p) => !mine.some((m) => m.id === p.id)) : []),
    [publicTrips, mine, slug]
  );

  // 県の観光エリア（MATCHAリンク付き）。未接続時は空のまま
  useEffect(() => {
    if (!code) return;
    let alive = true;
    setAreas([]);
    searchTourismAreas(PREFECTURE_EN_BY_ID[code] ?? '')
      .then((a) => alive && setAreas(a.slice(0, 3)))
      .catch(() => {});
    return () => { alive = false; };
  }, [code]);

  if (!code) return null;

  const name = prefectureName(code, locale);
  const photo = photoFor(code);
  const matchaUrl = localizeMatchaUrl(prefectureMatchaUrl(code));

  const openTrip = (id: string) => {
    onClose();
    router.push(`/trip/${id}`);
  };
  const newTrip = () => {
    if (guest) { setAskSignIn(true); return; }
    onClose();
    router.push('/trip/new');
  };

  const tripRow = (trip: Trip, sub: string) => (
    <Pressable key={trip.id} onPress={() => openTrip(trip.id)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
      <Row style={styles.row}>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong" tone="ink" numberOfLines={1}>{trip.title}</AppText>
          <AppText variant="small" tone="inkFaint" numberOfLines={1}>{sub}</AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={palette.matcha} />
      </Row>
      <Rule />
    </Pressable>
  );

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      {/* 背景。タップで閉じる */}
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(12,10,8,0.4)' }]} onPress={onClose} />

      <View style={[styles.sheet, { backgroundColor: palette.washiPaper, maxHeight: height * 0.72 }]}>
        <View style={[styles.grip, { backgroundColor: palette.ruleStrong }]} />
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
          {/* 見出し。県名と、閉じる */}
          <Row style={{ alignItems: 'baseline', gap: space.sm }}>
            <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 26, color: palette.ink }}>{name}</AppText>
            <AppText variant="small" tone="inkFaint" style={{ letterSpacing: 2 }}>
              {(PREFECTURE_EN_BY_ID[code] ?? '').toUpperCase()}
            </AppText>
            <View style={{ flex: 1 }} />
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={20} color={palette.inkFaint} />
            </Pressable>
          </Row>

          {/* ---------------- あなたの記録（最上段） ---------------- */}
          <Gap h={space.lg} />
          <Eyebrow tone="matcha">{t('prefCard.yours')}</Eyebrow>
          <Gap h={space.sm} />
          {mine.length ? (
            <>
              <AppText variant="small" tone="inkFaint">
                {t('prefCard.yoursMeta', { trips: mine.length, stops: stats.stops, photos: stats.photos })}
              </AppText>
              <Gap h={space.xs} />
              <Rule />
              {mine.slice(0, 3).map((trip) => tripRow(trip, trip.startDate.replace(/-/g, '.')))}
            </>
          ) : (
            <>
              <AppText variant="body" tone="inkSoft">{t('prefCard.none')}</AppText>
              <Gap h={space.md} />
              <Pressable
                onPress={newTrip}
                style={({ pressed }) => [styles.cta, { backgroundColor: palette.matcha }, pressed && { opacity: 0.85 }]}
              >
                <AppText variant="bodyStrong" style={{ color: '#fff' }}>{t('home.newTrip')}</AppText>
              </Pressable>
            </>
          )}

          {/* ---------------- みんなの旅 ---------------- */}
          {!!others.length && (
            <>
              <Gap h={space.xl} />
              <Eyebrow tone="matcha">{t('prefCard.others')}</Eyebrow>
              <Gap h={space.sm} />
              <Rule />
              {others.slice(0, 3).map((trip) => tripRow(trip, trip.ownerUsername ? `@${trip.ownerUsername}` : trip.subtitle))}
            </>
          )}

          {/* ---------------- 県の紹介（記録の下） ---------------- */}
          <Gap h={space.xl} />
          {!!photo && (
            <Image
              source={{ uri: photo.url }}
              style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 10, backgroundColor: palette.fill }}
              resizeMode="cover"
            />
          )}
          <Gap h={space.md} />
          <AppText variant="body" tone="inkSoft" style={{ lineHeight: 24 }}>
            {prefectureDescription(code, locale as Locale)}
          </AppText>

          {/* 行くなら（MATCHAへ） */}
          <Gap h={space.lg} />
          <Eyebrow tone="matcha">{t('quiz.result.spots', { name })}</Eyebrow>
          <Gap h={space.xs} />
          <Rule />
          {areas.map((a) => {
            const url = localizeMatchaUrl(a.matchaUrl);
            const inner = (
              <Row style={styles.row}>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" tone="ink" numberOfLines={1}>{a.name}</AppText>
                  <AppText variant="small" tone="inkFaint" numberOfLines={1}>{a.municipality}</AppText>
                </View>
                {!!url && <AppText variant="small" tone="matcha">MATCHA →</AppText>}
              </Row>
            );
            return url ? (
              <Pressable key={a.id} onPress={() => Linking.openURL(url)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                {inner}
                <Rule />
              </Pressable>
            ) : (
              <View key={a.id}>{inner}<Rule /></View>
            );
          })}
          {!!matchaUrl && (
            <Pressable onPress={() => Linking.openURL(matchaUrl)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
              <Row style={styles.row}>
                <AppText variant="bodyStrong" tone="ink" style={{ flex: 1 }}>
                  {t('quiz.aff.matchaTitle', { name })}
                </AppText>
                <AppText variant="small" tone="matcha">MATCHA →</AppText>
              </Row>
              <Rule />
            </Pressable>
          )}
        </ScrollView>
      </View>

      <SignInPrompt visible={askSignIn} onClose={() => setAskSignIn(false)} reason="save" />
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  grip: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, marginTop: 10 },
  row: { alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  cta: { height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
