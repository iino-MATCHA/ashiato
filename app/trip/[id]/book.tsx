/**
 * 製本（フォトブック）。台割を見せて、PDFに書き出す。
 * 章立て・ページ配分・写真選定は lib/photobook/plan.ts、
 * 実際の紙面は lib/photobook/render に分けてある。
 */
import { useEffect, useMemo, useState } from 'react';
import { View, Image, Pressable, ScrollView, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrip } from '@/lib/useData';
import { planBook, MIN_PHOTOS, type Page } from '@/lib/photobook/plan';
import { renderPage, renderPdf, PAGE_SIZE, type RenderProgress } from '@/lib/photobook/render';

import { useI18n } from '@/lib/i18n';
const PAGE_LABEL: Record<Page['kind'], string> = {
  cover: 'Cover',
  map: 'Route',
  itinerary: 'Itinerary',
  photos: 'Photos',
  colophon: 'Colophon',
};

/** プレビューを実描画する最大ページ数（それ以降はラベル表示のみ） */
const PREVIEW_LIMIT = 24;

export default function TripBook() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip } = useTrip(id);

  const plan = useMemo(() => (trip ? planBook(trip) : null), [trip]);
  const [previews, setPreviews] = useState<(string | null)[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  // 全ページを順に描いてプレビューにする（大きな本は上限まで）
  useEffect(() => {
    if (!plan || Platform.OS !== 'web') return;
    let alive = true;
    (async () => {
      const out: (string | null)[] = [];
      for (let i = 0; i < Math.min(plan.pages.length, PREVIEW_LIMIT); i++) {
        const url = await renderPage(plan, i);
        if (!alive) return;
        out.push(url);
        setPreviews([...out]);
      }
    })();
    return () => { alive = false; };
  }, [plan]);

  if (!trip || !plan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">{t('common.loading')}</AppText>
      </SafeAreaView>
    );
  }

  const thumbW = Math.min((width - space.lg * 2 - space.sm * 2) / 3, 120);
  const thumbH = thumbW * (PAGE_SIZE.height / PAGE_SIZE.width);
  const tooFewPhotos = plan.totalPhotos < MIN_PHOTOS;

  const exportPdf = async () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || busy) return;
    setBusy('Preparing page 1…');
    const blob = await renderPdf(plan, ({ done, total }: RenderProgress) => setBusy(`Rendering ${done} / ${total}…`));
    setBusy(null);
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
      <Header title={t('book.header')} />
      <Rule />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
        <AppText variant="h2" tone="ink">{trip.title}</AppText>
        <Gap h={space.xs} />
        <AppText variant="small" tone="inkFaint">
          A keepsake PDF of this trip — {plan.pages.length} pages · {plan.totalPhotos} photos · {plan.chapters.length} chapters
        </AppText>
        {tooFewPhotos && (
          <>
            <Gap h={space.md} />
            {/* 制限ではなく「あと◯枚」の見せ方で、写真の投稿を促す */}
            <Row style={{ gap: space.sm, alignItems: 'center', paddingVertical: space.sm }}>
              <Ionicons name="images-outline" size={18} color={palette.matcha} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" tone="ink">
                  {t('book.morePhotos', { n: MIN_PHOTOS - plan.totalPhotos })}
                </AppText>
                <AppText variant="small" tone="inkFaint">
                  {t('book.morePhotosSub')}
                </AppText>
              </View>
              <AppText variant="h3" tone="matcha">{plan.totalPhotos}/{MIN_PHOTOS}</AppText>
            </Row>
          </>
        )}

        {/* 台割 */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">{t('book.pagePlan')}</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ flexWrap: 'wrap', gap: space.sm }}>
          {plan.pages.map((p, i) => (
            <View key={i} style={{ width: thumbW }}>
              <View style={[styles.thumb, { width: thumbW, height: thumbH, borderColor: palette.rule, backgroundColor: palette.fill }]}>
                {previews[i] ? (
                  <Image source={{ uri: previews[i]! }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <AppText variant="small" tone="inkFaint">{PAGE_LABEL[p.kind]}</AppText>
                )}
              </View>
              <Gap h={4} />
              <AppText variant="small" tone="inkFaint" center>{i + 1} · {PAGE_LABEL[p.kind]}</AppText>
            </View>
          ))}
        </Row>

        {/* 章立て */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">{t('book.chapters')}</Eyebrow>
        <Gap h={space.sm} />
        <AppText variant="small" tone="inkFaint">{t('book.chaptersHint')}</AppText>
        <Gap h={space.md} />
        <Rule />
        {plan.chapters.map((ch, i) => (
          <View key={`${ch.prefCode}-${i}`}>
            <Row style={styles.chapter}>
              <AppText variant="small" tone="inkFaint" style={{ width: 26 }}>{i + 1}</AppText>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" tone="ink">
                  {ch.prefEn}{ch.visitNo > 1 ? ` (visit ${ch.visitNo})` : ''}
                </AppText>
                <AppText variant="small" tone="inkFaint">
                  {ch.stops.length} stops · {ch.photoCount} photos · {ch.days} day{ch.days === 1 ? '' : 's'}
                </AppText>
              </View>
              <AppText variant="small" tone="matcha">{ch.pages}p</AppText>
            </Row>
            <Rule />
          </View>
        ))}

        <Gap h={space.xl} />
        <Button
          label={busy ?? t('book.export')}
          tone="matcha"
          onPress={exportPdf}
          disabled={!!busy || tooFewPhotos || Platform.OS !== 'web'}
        />
        <Gap h={space.md} />
        <Row style={{ gap: 6, alignItems: 'flex-start' }}>
          <Ionicons name="information-circle-outline" size={16} color={palette.inkFaint} />
          <AppText variant="small" tone="inkFaint" style={{ flex: 1 }}>
            {t('book.freeNote')}
          </AppText>
        </Row>

        {/* 印刷版への導線。PDF自体には入れない（綺麗なまま共有された方が宣伝になる） */}
        <Gap h={space.lg} />
        <Pressable
          onPress={() => router.push(`/trip/${id}/bind`)}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <Rule />
          <Row style={{ gap: space.sm, alignItems: 'center', paddingVertical: space.md }}>
            <Ionicons name="book-outline" size={20} color={palette.matcha} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" tone="ink">{t('book.printTitle')}</AppText>
              <AppText variant="small" tone="inkFaint">{t('book.printBody')}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.matcha} />
          </Row>
          <Rule />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chapter: { alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  thumb: { borderWidth: hairline, borderRadius: 6, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
