import { useState } from 'react';
import { View, Pressable, StyleSheet, Share as RNShare, Platform, useWindowDimensions } from 'react-native';
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

  const stops = trip.steps
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
    .map((s) => ({ lat: s.lat, lng: s.lng, image: s.images[0] ?? '' }));
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
  };

  // プレビューと同じ scene を 1080px 幅で描き直して保存する
  const download = async () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || saving) return;
    setSaving(true);
    const dataUrl = await exportShareCard(cardMeta);
    setSaving(false);
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `ashiato-${trip.id}.png`;
    link.href = dataUrl;
    link.click();
  };
  const nativeShare = async (to: string) => {
    const text = `${trip.title} — ${prefs} prefectures, ${km} km with Ashiato #ashiato`;
    if (to === 'x' && Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
      return;
    }
    try { await RNShare.share({ message: text }); } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={t('share.header')} />
      <Rule />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
        <View style={styles.card}>
          <JourneyCard width={cardW} {...cardMeta} />
        </View>

        {/* export buttons */}
        <Gap h={space.lg} />
        <Row style={{ gap: space.xl }}>
          <ExportBtn icon="download-outline" label={saving ? t('common.saving') : t('common.save')} onPress={download} palette={palette} />
          <ExportBtn icon="logo-instagram" label="Stories" onPress={() => nativeShare('stories')} palette={palette} color="#C13584" />
          <ExportBtn icon="logo-twitter" label="X" onPress={() => nativeShare('x')} palette={palette} color={palette.ink} />
        </Row>
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
