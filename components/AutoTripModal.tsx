/**
 * 写真から旅を起こす、中央のモーダル。
 *
 *   ask（旅してますか？）→ 写真選択 → working（読込中）→ done（見ますか？）
 *
 * 画面は増やさない。読込中もこのモーダルの中で見せる。
 * 手入力の導線には触らない ―― これは入り口が増えただけで、できる記録は同じ。
 */
import { useRef, useState } from 'react';
import { View, Modal, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Gap, Button, Rule } from '@/components/ui';
import { PhotoPicker } from '@/components/PhotoPicker';
import { space, fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';
import { createTripFromPhotos, type AutoTripProgress, type AutoTripResult } from '@/lib/autotrip';

type Phase = 'ask' | 'working' | 'done' | 'failed';

export function AutoTripModal({
  visible,
  onClose,
}: {
  visible: boolean;
  /** 閉じたあとの行き先は呼び出し側が決める（オンボーディングなら /map へ） */
  onClose: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>('ask');
  const [progress, setProgress] = useState<AutoTripProgress>({ phase: 'reading', done: 0, total: 0 });
  const [result, setResult] = useState<AutoTripResult | null>(null);
  const running = useRef(false);

  const close = () => {
    setPhase('ask');
    setResult(null);
    onClose();
  };

  const run = async (files: File[]) => {
    if (running.current || !files.length) return;
    running.current = true;
    setPhase('working');
    setProgress({ phase: 'reading', done: 0, total: files.length });
    const res = await createTripFromPhotos(files, setProgress);
    running.current = false;
    setResult(res);
    setPhase(res.failure ? 'failed' : 'done');
  };

  const openTrip = () => {
    const id = result?.tripId;
    setPhase('ask');
    setResult(null);
    onClose();
    if (id) router.push(`/trip/${id}`);
  };

  const dismissable = phase === 'ask' || phase === 'failed';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => dismissable && close()}>
      <Pressable style={styles.backdrop} onPress={() => dismissable && close()}>
        <Pressable style={[styles.sheet, { backgroundColor: palette.washi }]} onPress={() => {}}>

          {phase === 'ask' && (
            <>
              <Row style={{ gap: 8, alignItems: 'center' }}>
                <Ionicons name="images-outline" size={17} color={palette.matcha} />
                <AppText variant="eyebrow" tone="matcha">{t('auto.eyebrow')}</AppText>
              </Row>
              <Gap h={space.md} />
              <AppText style={[styles.title, { color: palette.ink }]}>{t('auto.askTitle')}</AppText>
              <Gap h={space.md} />
              <AppText variant="small" tone="inkSoft" style={{ lineHeight: 22 }}>{t('auto.askBody')}</AppText>

              <Gap h={space.lg} />
              <Rule />
              <Gap h={space.md} />
              {[t('auto.point1'), t('auto.point2'), t('auto.point3')].map((p) => (
                <Row key={p} style={{ gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
                  <Ionicons name="checkmark" size={14} color={palette.matcha} style={{ marginTop: 3 }} />
                  <AppText variant="small" tone="inkSoft" style={{ flex: 1, lineHeight: 19 }}>{p}</AppText>
                </Row>
              ))}

              <Gap h={space.lg} />
              {/* 実物の <input type=file> を敷いているので、Pressable では包まない */}
              <PhotoPicker onPick={run} multiple style={styles.pickWrap}>
                <View style={[styles.pick, { backgroundColor: palette.matcha }]}>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                  <AppText variant="bodyStrong" style={{ color: '#fff' }}>{t('auto.pick')}</AppText>
                </View>
              </PhotoPicker>
              <Gap h={space.md} />
              <Pressable onPress={close} hitSlop={8}>
                <AppText variant="small" tone="inkFaint" center>{t('auto.notYet')}</AppText>
              </Pressable>
            </>
          )}

          {phase === 'working' && (
            <View style={{ alignItems: 'center', paddingVertical: space.md }}>
              <ActivityIndicator color={palette.matcha} />
              <Gap h={space.lg} />
              <AppText style={[styles.title, { color: palette.ink, textAlign: 'center', fontSize: 22 }]}>
                {t(`auto.phase.${progress.phase}`)}
              </AppText>
              <Gap h={space.lg} />
              <View style={[styles.bar, { backgroundColor: palette.rule }]}>
                <View
                  style={{
                    height: '100%',
                    borderRadius: 999,
                    backgroundColor: palette.matcha,
                    width: `${barWidth(progress)}%`,
                  }}
                />
              </View>
              <Gap h={space.sm} />
              <AppText variant="small" tone="inkFaint">
                {progress.total ? `${progress.done} / ${progress.total}` : ''}
              </AppText>
              <Gap h={space.md} />
              <AppText variant="small" tone="inkFaint" center style={{ lineHeight: 19 }}>
                {t('auto.workingNote')}
              </AppText>
            </View>
          )}

          {phase === 'done' && result && (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="map-outline" size={38} color={palette.matcha} />
              <Gap h={space.lg} />
              <AppText style={[styles.title, { color: palette.ink, textAlign: 'center' }]}>{t('auto.doneTitle')}</AppText>
              <Gap h={space.md} />
              <AppText variant="small" tone="inkSoft" center style={{ lineHeight: 21 }}>
                {t('auto.doneBody', { stops: result.stops, photos: result.photos })}
              </AppText>
              {result.skipped > 0 && (
                <>
                  <Gap h={space.sm} />
                  <AppText variant="small" tone="inkFaint" center style={{ fontSize: 11 }}>
                    {t('auto.doneSkipped', { n: result.skipped })}
                  </AppText>
                </>
              )}
              <Gap h={space.xl} />
              <View style={{ alignSelf: 'stretch' }}>
                <Button label={t('auto.see')} tone="matcha" onPress={openTrip} />
                <Gap h={space.md} />
                <Pressable onPress={close} hitSlop={8}>
                  <AppText variant="small" tone="inkFaint" center>{t('auto.later')}</AppText>
                </Pressable>
              </View>
            </View>
          )}

          {phase === 'failed' && (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="alert-circle-outline" size={36} color={palette.shu} />
              <Gap h={space.lg} />
              <AppText variant="h3" tone="ink" center>{t(`auto.fail.${result?.failure ?? 'save-failed'}`)}</AppText>
              <Gap h={space.md} />
              <AppText variant="small" tone="inkSoft" center style={{ lineHeight: 21 }}>{t('auto.failHint')}</AppText>
              <Gap h={space.xl} />
              <View style={{ alignSelf: 'stretch' }}>
                <PhotoPicker onPick={run} multiple style={styles.pickWrap}>
                  <View style={[styles.pick, { backgroundColor: palette.matcha }]}>
                    <AppText variant="bodyStrong" style={{ color: '#fff' }}>{t('auto.retry')}</AppText>
                  </View>
                </PhotoPicker>
                <Gap h={space.md} />
                <Pressable onPress={close} hitSlop={8}>
                  <AppText variant="small" tone="inkFaint" center>{t('auto.manual')}</AppText>
                </Pressable>
              </View>
            </View>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** 4つの工程を通しで1本のゲージに見せる。工程ごとに巻き戻ると進んでいないように見える。 */
function barWidth(p: AutoTripProgress): number {
  const weights: Record<AutoTripProgress['phase'], [number, number]> = {
    reading: [0, 35],
    placing: [35, 55],
    naming: [55, 65],
    saving: [65, 100],
  };
  const [from, to] = weights[p.phase];
  const ratio = p.total ? p.done / p.total : 0;
  return Math.round(from + (to - from) * Math.min(1, ratio));
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  sheet: { width: '100%', maxWidth: 380, borderRadius: 18, padding: space.lg },
  title: { fontFamily: fonts.minchoBold, fontSize: 26, lineHeight: 36 },
  pickWrap: { borderRadius: 10 },
  pick: { height: 50, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bar: { alignSelf: 'stretch', height: 4, borderRadius: 999, overflow: 'hidden' },
});
