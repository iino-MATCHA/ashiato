/**
 * 手元のジャーナル一覧。
 * 旅ごとのPDFを「あの旅のどこだっけ」とならないよう1か所に並べる。
 * 印刷版の販売はやめたので、この画面はPDFだけを扱う。
 */
import { useState } from 'react';
import { View, Image, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrips } from '@/lib/useData';
import { useI18n } from '@/lib/i18n';
import { planBook, MIN_PHOTOS } from '@/lib/photobook/plan';
import { renderPdf, type RenderProgress } from '@/lib/photobook/render';
import type { Trip } from '@/lib/mock';

export default function Journals() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { trips } = useTrips();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const mine = trips.filter((tr) => !tr.sample);

  const download = async (trip: Trip) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || busyId) return;
    setBusyId(trip.id);
    setProgress('');
    const plan = planBook(trip);
    const blob = await renderPdf(plan, ({ done, total }: RenderProgress) => setProgress(`${done}/${total}`));
    setBusyId(null);
    setProgress('');
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `my-japan-journal-${trip.id}.pdf`;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={t('settings.journals')} />
      <Rule />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>

        <Eyebrow tone="matcha">{t('journals.eyebrow')}</Eyebrow>
        <Gap h={space.sm} />
        <AppText variant="small" tone="inkFaint">{t('journals.hint')}</AppText>
        <Gap h={space.md} />
        <Rule />

        {mine.length === 0 && (
          <View style={{ paddingVertical: space.xl }}>
            <AppText variant="small" tone="inkFaint" center>{t('journals.noTrips')}</AppText>
          </View>
        )}

        {mine.map((trip) => {
          const plan = planBook(trip);
          const few = plan.totalPhotos < MIN_PHOTOS;
          const busy = busyId === trip.id;
          return (
            <View key={trip.id}>
              <Row style={styles.row}>
                <Pressable onPress={() => router.push(`/trip/${trip.id}/book`)} style={styles.thumbWrap}>
                  {trip.steps[0]?.images[0] ? (
                    <Image source={{ uri: trip.steps[0].images[0] }} style={styles.thumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: palette.fill, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="book-outline" size={18} color={palette.inkFaint} />
                    </View>
                  )}
                </Pressable>
                <Pressable style={{ flex: 1 }} onPress={() => router.push(`/trip/${trip.id}/book`)}>
                  <AppText variant="bodyStrong" tone="ink" numberOfLines={1}>{trip.title}</AppText>
                  <AppText variant="small" tone="inkFaint">
                    {trip.startDate.replace(/-/g, '.')} · {plan.pages.length}p · {t('journals.photosCount', { n: plan.totalPhotos })}
                  </AppText>
                </Pressable>
                {few ? (
                  <AppText variant="small" tone="inkFaint">{plan.totalPhotos}/{MIN_PHOTOS}</AppText>
                ) : (
                  <Pressable onPress={() => download(trip)} disabled={!!busyId} hitSlop={8}>
                    <Row style={{ gap: 5, alignItems: 'center' }}>
                      <Ionicons name={busy ? 'hourglass-outline' : 'download-outline'} size={17} color={palette.matcha} />
                      <AppText variant="small" tone="matcha">{busy ? progress || '…' : 'PDF'}</AppText>
                    </Row>
                  </Pressable>
                )}
              </Row>
              <Rule />
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.md, alignItems: 'center', paddingVertical: space.md },
  thumbWrap: { borderRadius: 8, overflow: 'hidden' },
  thumb: { width: 52, height: 52, borderRadius: 8 },
});
