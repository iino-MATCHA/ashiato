/**
 * /map と /goshuin をひとつにした画面。
 *
 * 上半分は動かない ―― 日本地図・制覇ゲージ・ランクの帯。
 * 下半分はボトムシートで、中身だけが「旅」と「御朱印」で入れ替わる。
 * 地図を見たまま切り替えられるので、行った県と集めた印が地続きになる。
 *
 * 切り替えは画面遷移ではなく中身の差し替えにしてある。上の地図が
 * 描き直されないので、切り替えても地図が一瞬消えたりしない。
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row } from '@/components/ui';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { CoverageGauge } from '@/components/CoverageGauge';
import { RankModal, rankFor } from '@/components/RankModal';
import { WashiBackground } from '@/components/WashiBackground';
import { BottomSheet } from '@/components/BottomSheet';
import { TripsPane } from '@/components/home/TripsPane';
import { GoshuinPane } from '@/components/home/GoshuinPane';
import { space, fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { PREFECTURE_TOTAL } from '@/lib/mock';
import { useVisitedPrefectures } from '@/lib/useData';
import { contentHeight, VB_W } from '@/lib/ugc/geo';
import { useI18n } from '@/lib/i18n';

export type HomeView = 'map' | 'goshuin';

export function HomeScreen({ initialView = 'map' }: { initialView?: HomeView }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { codes: visited } = useVisitedPrefectures();
  const count = visited.length;

  const [view, setView] = useState<HomeView>(initialView);
  const [rankOpen, setRankOpen] = useState(false);

  // タブを踏み直したときは、その入口の中身に戻す
  useEffect(() => setView(initialView), [initialView]);

  /** 中身が入れ替わったら、静かに浮かび上がらせる */
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [view]);

  /**
   * 高さの割り振り。
   * シートは既定で画面の下 1/4。地図はその残りに収まる一番大きな寸法にする
   * （幅で決め打ちにすると、縦の短い端末で地図がシートに潜り込む）。
   */
  const usable = height - insets.top - 72 - insets.bottom; // タブバーぶんを除いた高さ
  const collapsed = Math.round(Math.max(150, usable * 0.26));
  const expanded = Math.round(usable - 56);
  const ratio = contentHeight() / VB_W;
  const topRoom = usable - collapsed - 84; // ランクの帯と余白のぶん
  const mapW = Math.round(Math.max(180, Math.min(width - space.lg * 2, 380, topRoom / ratio)));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top']}>
      {/* ---------------- 上半分（動かない） ---------------- */}
      <View style={{ alignItems: 'center', paddingTop: space.sm }}>
        <View style={{ width: mapW }}>
          <JapanSvgMap visited={visited} width={mapW} okinawaInset />

          {/* 集めた数。北海道の左隣、地図の空いている所に置く */}
          <View style={styles.countSlot} pointerEvents="none">
            <Row style={{ alignItems: 'baseline', gap: 3 }}>
              <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 30, color: palette.shu, lineHeight: 34 }}>
                {count}
              </AppText>
              <AppText variant="small" tone="inkFaint">/ {PREFECTURE_TOTAL}</AppText>
            </Row>
          </View>

          {/* 制覇ゲージ。行の高さに影響させないため絶対配置 */}
          <View style={styles.gaugeSlot} pointerEvents="box-none">
            <CoverageGauge visitedCodes={visited} total={PREFECTURE_TOTAL} />
          </View>
        </View>
      </View>

      {/* ランクの帯 */}
      <View style={{ paddingHorizontal: space.lg, marginTop: space.sm }}>
        <Pressable onPress={() => setRankOpen(true)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <Row style={[styles.rankBand, { borderColor: palette.ruleStrong }]}>
            <AppText variant="eyebrow" tone="inkFaint">{t('goshuin.rank')}</AppText>
            <Row style={{ gap: 6, alignItems: 'center' }}>
              <AppText variant="h3" tone="ai">{rankFor(count)}</AppText>
              <Ionicons name="information-circle-outline" size={16} color={palette.inkFaint} />
            </Row>
          </Row>
        </Pressable>
      </View>
      <RankModal visible={rankOpen} onClose={() => setRankOpen(false)} count={count} />

      {/* ---------------- 下半分（ボトムシート） ---------------- */}
      <BottomSheet
        collapsedHeight={collapsed}
        expandedHeight={expanded}
        background={view === 'goshuin' ? <WashiBackground /> : undefined}
        header={
          view === 'goshuin' ? (
            <Pressable onPress={() => setView('map')} hitSlop={12} style={styles.back}>
              <Ionicons name="chevron-back" size={22} color={palette.ink} />
            </Pressable>
          ) : undefined
        }
      >
        <Animated.View style={{ flex: 1, opacity: fade }}>
          {view === 'goshuin' ? (
            <GoshuinPane visited={visited} />
          ) : (
            <TripsPane visited={visited} onOpenGoshuin={() => setView('goshuin')} />
          )}
        </Animated.View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 北海道は地図の右上にあるので、その左隣＝左上が空いている
  countSlot: { position: 'absolute', left: 0, top: '4%' },
  // 地図の右端・上下中ほど（この高さは海しか無いので絵に重ならない）
  gaugeSlot: { position: 'absolute', right: -6, top: '26%' },
  rankBand: {
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.sm,
  },
  back: { position: 'absolute', left: space.md, top: 2, padding: 4 },
});
