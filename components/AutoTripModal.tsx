/**
 * 写真から旅を起こす、中央のモーダル。
 *
 *   ask（旅してますか？）→ 写真選択 → working（読込中）→ done（見ますか？）
 *
 * 画面は増やさない。読込中もこのモーダルの中で見せる。
 * 手入力の導線には触らない ―― これは入り口が増えただけで、できる記録は同じ。
 */
import { useRef, useState } from 'react';
import { View, Image, Modal, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Gap, Button } from '@/components/ui';
import { PhotoPicker } from '@/components/PhotoPicker';
import { space, fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';
import { createTripFromPhotos, addStopsFromPhotos, type AutoTripProgress, type AutoTripResult } from '@/lib/autotrip';

type Phase = 'ask' | 'working' | 'done' | 'failed';

export function AutoTripModal({
  visible,
  onClose,
  tripId,
}: {
  visible: boolean;
  /** 閉じたあとの行き先は呼び出し側が決める（オンボーディングなら /map へ） */
  onClose: () => void;
  /**
   * 渡すと「その旅に立ち寄り先を足す」モードになる。
   * 旅の題も期間も触らず、写真の日付どおりに差し込む。
   * 渡さなければ、新しい旅を1件作る。
   */
  tripId?: string;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const adding = !!tripId;
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
    const res = tripId
      ? await addStopsFromPhotos(tripId, files, setProgress)
      : await createTripFromPhotos(files, setProgress);
    running.current = false;
    setResult(res);
    setPhase(res.failure ? 'failed' : 'done');
  };

  const openTrip = () => {
    const id = result?.tripId;
    setPhase('ask');
    setResult(null);
    onClose();
    // 足しただけのときは、いま見ている旅にそのまま留まる
    if (id && !adding) router.push(`/trip/${id}`);
  };

  const dismissable = phase === 'ask' || phase === 'failed';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => dismissable && close()}>
      <Pressable style={styles.backdrop} onPress={() => dismissable && close()}>
        <Pressable style={[styles.sheet, { backgroundColor: palette.paper, borderColor: palette.rule }]} onPress={() => {}}>

          {phase === 'ask' && (
            <>
              {/* 机に投げ出した3枚の写真。言葉より先に、何を渡せばいいのかを見せる */}
              <PhotoStack palette={palette} />

              <Gap h={space.lg} />
              <Row style={{ gap: 8, alignItems: 'center' }}>
                <Ionicons name="images-outline" size={17} color={palette.matcha} />
                <AppText variant="eyebrow" tone="matcha">{t('auto.eyebrow')}</AppText>
              </Row>
              <Gap h={space.md} />
              <AppText style={[styles.title, { color: palette.ink }]}>
                {t(adding ? 'auto.addTitle' : 'auto.askTitle')}
              </AppText>
              <Gap h={space.md} />
              <AppText variant="small" tone="ink" style={{ lineHeight: 22, opacity: 0.86 }}>
                {t(adding ? 'auto.addBody' : 'auto.askBody')}
              </AppText>

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
              <AppText style={[styles.title, { color: palette.ink, textAlign: 'center' }]}>
                {t(adding ? 'auto.addDoneTitle' : 'auto.doneTitle')}
              </AppText>
              <Gap h={space.md} />
              <AppText variant="small" tone="ink" center style={{ lineHeight: 21, opacity: 0.86 }}>
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
                <Button label={t(adding ? 'common.close' : 'auto.see')} tone="matcha" onPress={openTrip} />
                {/* 足しただけのときは、閉じる以外に行き先が無い */}
                {!adding && (
                  <>
                    <Gap h={space.md} />
                    <Pressable onPress={close} hitSlop={8}>
                      <AppText variant="small" tone="inkFaint" center>{t('auto.later')}</AppText>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          )}

          {phase === 'failed' && (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="alert-circle-outline" size={36} color={palette.shu} />
              <Gap h={space.lg} />
              <AppText variant="h3" tone="ink" center>{t(`auto.fail.${result?.failure ?? 'save-failed'}`)}</AppText>
              <Gap h={space.md} />
              <AppText variant="small" tone="ink" center style={{ lineHeight: 21, opacity: 0.86 }}>{t('auto.failHint')}</AppText>
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

/**
 * 重なり合った3枚の写真。
 * 白フチをつけて少しずつ傾け、机に置いた紙焼きのように見せる。
 * 中の1枚だけを正面に立て、両脇を後ろへ倒す。
 */
function PhotoStack({ palette }: { palette: any }) {
  const shots = [STACK[0], STACK[1], STACK[2]];
  return (
    <View style={styles.stack}>
      {shots.map((s, i) => {
        const angle = [-9, 0, 8][i];
        const shift = [-72, 0, 72][i];
        const drop = [10, 0, 14][i];
        return (
          <View
            key={s.src}
            style={[
              styles.print,
              {
                backgroundColor: palette.paper,
                transform: [{ translateX: shift }, { translateY: drop }, { rotate: `${angle}deg` }],
                zIndex: i === 1 ? 3 : 1,
              },
            ]}
          >
            <Image source={{ uri: s.src }} style={styles.printImg} resizeMode="cover" />
          </View>
        );
      })}
    </View>
  );
}

/** LPと同じ写真を使う（別の絵を持ち込まない）。 */
const STACK = [
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shirakawa-go_%282017-07-22%29.jpg/960px-Shirakawa-go_%282017-07-22%29.jpg' },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Fushimiinari-taisha%2C_gehaiden-1.jpg/960px-Fushimiinari-taisha%2C_gehaiden-1.jpg' },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Kabira-Bay-Kabira-park-2019.jpg/960px-Kabira-Bay-Kabira-park-2019.jpg' },
];

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
  // 中央のモーダルなので、背景は思い切って落とす。半端に暗いと
  // シートの縁が地図やLPに溶けて、どこからが本文か分からなくなる
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  sheet: {
    width: '100%', maxWidth: 380, borderRadius: 18, padding: space.lg, borderWidth: hairline,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
  title: { fontFamily: fonts.minchoBold, fontSize: 26, lineHeight: 36 },
  pickWrap: { borderRadius: 10 },
  pick: { height: 50, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bar: { alignSelf: 'stretch', height: 4, borderRadius: 999, overflow: 'hidden' },
  stack: { height: 168, alignItems: 'center', justifyContent: 'center' },
  print: {
    position: 'absolute', width: 132, height: 132, padding: 6, borderRadius: 3,
    shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  printImg: { width: '100%', height: '100%', borderRadius: 1 },
});
