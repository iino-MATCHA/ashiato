/**
 * 立ち寄り先1つぶんのシェア画面。
 *
 * 旅のシェアは旅が終わらないと作れないが、これは旅の途中で何度でも作れる。
 * 写真が複数あるときは、どれを出すかその場で選べるようにする。
 */
import { useRef, useState } from 'react';
import { View, Image, Pressable, StyleSheet, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { StopCard } from '@/components/ugc/StopCard';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrip } from '@/lib/useData';
import { exportStopCard } from '@/lib/stopCard';
import { shareImage, saveImage, type ShareTarget } from '@/lib/shareImage';
import { captureCard } from '@/lib/cardShot';
import { CopyLink } from '@/components/CopyLink';
import { track } from '@/lib/analytics';
import { useI18n } from '@/lib/i18n';
import { siteUrl } from '@/lib/site';

export default function StepShare() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { width, height } = useWindowDimensions();
  const { id, stepId } = useLocalSearchParams<{ id: string; stepId: string }>();
  const { trip } = useTrip(id);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<ShareTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // 写真が複数あるとき、どれを出すか
  const [pick, setPick] = useState(0);
  const cardRef = useRef<View | null>(null);

  const step = trip?.steps.find((s) => s.id === stepId);

  if (!trip || !step) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">{t('common.loading')}</AppText>
      </SafeAreaView>
    );
  }

  const images = step.images ?? [];
  const cardW = Math.min(width - space.lg * 2, (height - 300) * 9 / 16, 320);

  const meta = {
    image: images[pick] ?? '',
    title: step.title,
    place: step.placeName,
    prefecture: step.prefectureName,
    dateLabel: step.loggedAt.replace(/-/g, '.'),
  };

  /** この地点のページ。投稿に添えると、貼り先でその旅が開く */
  const url = siteUrl(`trip/${trip.id}/step/${step.id}`);

  const download = async () => {
    track('share_ugc', { type: 'stop', method: 'download' });
    if (Platform.OS !== 'web' || typeof document === 'undefined' || saving) return;
    setSaving(true);
    const dataUrl = await exportStopCard(meta);
    setSaving(false);
    if (!dataUrl) return setNotice(t('share.failed'));
    const res = await saveImage(dataUrl, `my-japan-${step.id}.png`);
    if (res === 'failed') setNotice(t('share.failed'));
  };

  const send = async (to: ShareTarget) => {
    track('share_ugc', { type: 'stop', method: to });
    if (busy) return;
    setBusy(to);
    setNotice(null);
    const dataUrl = (await captureCard(cardRef)) ?? (await exportStopCard(meta));
    const text = `${step.title} — ${step.placeName}, ${step.prefectureName} #myjapan`;
    const res = dataUrl ? await shareImage(to, dataUrl, text, `my-japan-${step.id}.png`, url) : 'failed';
    setBusy(null);
    if (res === 'downloaded') setNotice(t('share.savedThenAttach'));
    else if (res === 'failed') setNotice(t('share.failed'));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={t('share.stopHeader')} />
      <Rule />
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: space.lg }} showsVerticalScrollIndicator={false}>
        <View ref={cardRef} collapsable={false} style={styles.card}>
          <StopCard width={cardW} {...meta} />
        </View>

        {/* 写真が複数あるときだけ、どれを出すか選ばせる */}
        {images.length > 1 && (
          <>
            <Gap h={space.md} />
            <Row style={{ gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: cardW }}>
              {images.slice(0, 8).map((uri, i) => (
                <Pressable key={i} onPress={() => setPick(i)}>
                  <Image
                    source={{ uri }}
                    style={[styles.thumb, { borderColor: i === pick ? palette.matcha : 'transparent' }]}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </Row>
          </>
        )}

        <Gap h={space.lg} />
        <CopyLink url={url} label={t('share.copyStopLink')} />
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
      </ScrollView>
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
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  thumb: { width: 44, height: 44, borderRadius: 6, borderWidth: hairline * 2 },
  exportCircle: { width: 54, height: 54, borderRadius: 27, borderWidth: hairline * 2, alignItems: 'center', justifyContent: 'center' },
});
