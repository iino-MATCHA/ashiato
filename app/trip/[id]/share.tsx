import { useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { JourneyCard } from '@/components/ugc/JourneyCard';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrip } from '@/lib/useData';
import { exportShareCard } from '@/lib/shareCard';
import { shareImage, saveImage, type ShareTarget } from '@/lib/shareImage';
import { captureCard } from '@/lib/cardShot';
import { CopyLink } from '@/components/CopyLink';
import { track } from '@/lib/analytics';
import { PREFECTURE_ID_BY_SLUG, slugForName } from '@/lib/prefectures';

import { useI18n } from '@/lib/i18n';
function daysBetween(a?: string, b?: string): number {
  if (!a || !b) return 0;
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
}

/** 「2026.04 – 05」のような短い表記。カードの隅に置くので情報は最小に。 */
function dateRange(a?: string, b?: string): string {
  if (!a) return '';
  const s = a.replace(/-/g, '.').slice(0, 7);
  if (!b || b.slice(0, 7) === a.slice(0, 7)) return s;
  return `${s} – ${b.replace(/-/g, '.').slice(5, 7)}`;
}

export default function TripShare() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { width, height } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip } = useTrip(id);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<ShareTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // ネイティブはこのビューを写し取って画像にする
  const cardRef = useRef<View | null>(null);

  if (!trip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">{t('common.loading')}</AppText>
      </SafeAreaView>
    );
  }

  // 9:16 story card, sized to fit the screen
  const cardW = Math.min(width - space.lg * 2, (height - 250) * 9 / 16, 340);

  const prefs = trip.prefectures.length;
  const days = daysBetween(trip.startDate, trip.endDate);
  const km = trip.distanceKm;

  /**
   * 付箋に出す「Day 8–14」。
   * 旅の開始日からの日数で数え、次の地点の前日までを1区間にする。
   * 最後の地点は旅の終わりまで。
   */
  const dayOf = (iso: string): number => {
    if (!trip.startDate || !iso) return 0;
    const a = new Date(trip.startDate).getTime();
    const b = new Date(iso).getTime();
    if (isNaN(a) || isNaN(b)) return 0;
    return Math.max(1, Math.round((b - a) / 86400000) + 1);
  };

  const placed = trip.steps.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));
  const stops = placed.map((s, i) => {
    const from = dayOf(s.loggedAt);
    const next = placed[i + 1];
    const to = next ? Math.max(from, dayOf(next.loggedAt) - 1) : Math.max(from, days);
    return {
      lat: s.lat,
      lng: s.lng,
      image: s.images[0] ?? '',
      day: from === to ? `Day ${from}` : `Day ${from}–${to}`,
      place: s.prefectureName || s.placeName,
    };
  });
  const visitedPrefectureCodes = trip.prefectures
    .map((name) => PREFECTURE_ID_BY_SLUG[slugForName(name)])
    .filter((n): n is number => !!n);

  const cardMeta = {
    title: trip.title,
    dateLabel: dateRange(trip.startDate, trip.endDate),
    prefectures: prefs,
    days,
    km,
    stops,
    visitedPrefectureCodes,
    // ポラロイドに手書きで添える地名
    coverCaption: placed[0]?.placeName ?? '',
  };

  // プレビューと同じ scene を 1080px 幅で描き直して保存する
  const download = async () => {
    track('share_ugc', { type: 'trip', method: 'download' });
    if (Platform.OS !== 'web' || typeof document === 'undefined' || saving) return;
    setSaving(true);
    const dataUrl = await exportShareCard(cardMeta);
    setSaving(false);
    if (!dataUrl) return setNotice(t('share.failed'));
    const res = await saveImage(dataUrl, `my-japan-${trip.id}.png`);
    if (res === 'failed') setNotice(t('share.failed'));
  };

  /**
   * カードを画像にして、そのままSNSへ渡す。
   * Web は Canvas で 1080px に描き直し、ネイティブは画面のカードを写し取る。
   */
  /** 旅の共有ページ。投稿にこれを添えると、貼り先でOGPのカードが開く */
  const tripUrl = `https://www.my-japan-matcha.com/trip/${trip.id}`;

  const send = async (to: ShareTarget) => {
    track('share_ugc', { type: 'trip', method: to });
    if (busy) return;
    setBusy(to);
    setNotice(null);
    const dataUrl = (await captureCard(cardRef)) ?? (await exportShareCard(cardMeta));
    const text = `${trip.title} — ${prefs} prefectures, ${km} km with My Japan #myjapan`;
    const res = dataUrl
      ? await shareImage(to, dataUrl, text, `my-japan-${trip.id}.png`, tripUrl)
      : 'failed';
    setBusy(null);
    // 共有シートが使えない環境では画像を保存して投稿画面を開くので、その旨を伝える
    if (res === 'downloaded') setNotice(t('share.savedThenAttach'));
    else if (res === 'failed') setNotice(t('share.failed'));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={t('share.header')} />
      <Rule />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
        <View ref={cardRef} collapsable={false} style={styles.card}>
          <JourneyCard width={cardW} {...cardMeta} />
        </View>

        {/* export buttons */}
        <Gap h={space.lg} />
        <CopyLink url={tripUrl} label={t('share.copyTripLink')} />
        <Gap h={space.md} />
        <Row style={{ gap: space.xl }}>
          <ExportBtn icon="download-outline" label={saving ? t('common.saving') : t('common.save')} onPress={download} palette={palette} />
          <ExportBtn icon="logo-instagram" label={busy === 'instagram' ? '…' : 'Stories'} onPress={() => send('instagram')} palette={palette} color="#C13584" />
          <ExportBtn icon="logo-twitter" label={busy === 'x' ? '…' : 'X'} onPress={() => send('x')} palette={palette} color={palette.ink} />
        </Row>
        {!!notice && (
          <>
            <Gap h={space.md} />
            <AppText variant="small" tone="inkFaint" center style={{ maxWidth: 300, lineHeight: 19 }}>{notice}</AppText>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function ExportBtn({ icon, label, onPress, palette, color }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ alignItems: 'center', opacity: pressed ? 0.6 : 1 }]}>
      <View style={[styles.exportCircle, { borderColor: palette.ruleStrong }]}>
        <Ionicons name={icon} size={22} color={color ?? palette.ink} />
      </View>
      <Gap h={4} />
      <AppText variant="small" tone="inkSoft">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FBFAF7',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  exportCircle: { width: 54, height: 54, borderRadius: 27, borderWidth: StyleSheet.hairlineWidth * 2, alignItems: 'center', justifyContent: 'center' },
});
