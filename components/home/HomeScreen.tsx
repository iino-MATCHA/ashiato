/**
 * /map と /goshuin をひとつにした画面。
 *
 * 上半分は動かない ―― 日本地図と制覇ゲージ。
 * 下半分はボトムシートで、中身だけが「旅」と「御朱印」で入れ替わる。
 * 地図を見たまま切り替えられるので、行った県と集めた印が地続きになる。
 *
 * 切り替えは画面遷移ではなく中身の差し替えにしてある。上の地図が
 * 描き直されないので、切り替えても地図が一瞬消えたりしない。
 *
 * 地の色はシートと同じ和紙。全面まで伸ばしたときに継ぎ目が出ず、
 * そのまま一枚の紙になる。
 */
import { useEffect, useState } from 'react';
import { router, usePathname } from 'expo-router';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row } from '@/components/ui';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { CoverageGauge } from '@/components/CoverageGauge';
import { BottomSheet } from '@/components/BottomSheet';
import { TripsPane } from '@/components/home/TripsPane';
import { GoshuinPane } from '@/components/home/GoshuinPane';
import { space, fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { PREFECTURE_TOTAL } from '@/lib/mock';
import { useVisitedPrefectures } from '@/lib/useData';
import { contentHeight, VB_W } from '@/lib/ugc/geo';
import { useI18n } from '@/lib/i18n';

/**
 * 中身が入れ替わったときのフェードだけ、CSS に任せる。
 * この画面の Animated は Web で走らないことがある（シートで実測）ため、
 * ブラウザ側の keyframes に持たせる。動かなくても中身は必ず見える。
 */
const HOME_CSS = `
[data-mjfade="1"] { animation: mjFadeIn .26s ease both; }
@keyframes mjFadeIn { from { opacity: 0 } to { opacity: 1 } }
`;
let homeCssInjected = false;
function injectHomeCss() {
  if (Platform.OS !== 'web' || homeCssInjected || typeof document === 'undefined') return;
  homeCssInjected = true;
  const tag = document.createElement('style');
  tag.textContent = HOME_CSS;
  document.head.appendChild(tag);
}

export type HomeView = 'map' | 'goshuin';

export function HomeScreen({ initialView = 'map' }: { initialView?: HomeView }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { codes: visited } = useVisitedPrefectures();
  const count = visited.length;

  injectHomeCss();
  const [view, setView] = useState<HomeView>(initialView);
  // シートが全面のときは「＜」を出さない（紙の途中に浮いて見えるため）
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();

  /**
   * 「＜」で旅の面へ戻る。
   * /goshuin を直接開いていた場合は、面を切り替えるだけでは経路が
   * 御朱印のままになるので、/map の画面そのものへ戻す。
   */
  const backToMap = () => {
    if (pathname?.includes('goshuin')) router.replace('/(tabs)/map');
    else setView('map');
  };

  // タブを踏み直したときは、その入口の中身に戻す
  useEffect(() => setView(initialView), [initialView]);


  /**
   * 高さの割り振り。
   * まず地図の寸法を決め、シートは**そのすぐ下**から始める。
   * ランクの帯を外したぶん、シートを上へ寄せられる。
   * 上げすぎると地図に被り、下げすぎるとシートの中身が読めないので、
   * 使える高さの 34〜62% の間に収める。
   */
  /**
   * タブバーは浮いていて画面の上に重なるので、画面そのものは下まで使える。
   * 以前はここでバーのぶん(72)を引いていたため、全面まで伸ばしても
   * 上が72px余っていた。
   */
  const usable = height - insets.top;
  const ratio = contentHeight() / VB_W;
  const mapW = Math.round(Math.max(180, Math.min(width - space.lg * 2, 380, (usable * 0.54) / ratio)));
  const mapH = mapW * ratio;
  const collapsed = Math.round(
    Math.min(usable * 0.62, Math.max(usable * 0.34, usable - (mapH + space.sm + 12)))
  );
  const expanded = Math.round(usable); // 伸ばしきったら上まで覆う

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

      {/* ---------------- 下半分（ボトムシート） ---------------- */}
      <BottomSheet collapsedHeight={collapsed} expandedHeight={expanded} onOpenChange={setSheetOpen}>
        {/* key を変えて作り直し、CSSのフェードを毎回走らせる */}
        <View key={view} {...(Platform.OS === 'web' ? ({ dataSet: { mjfade: '1' } } as any) : null)} style={{ flex: 1 }}>
          {view === 'goshuin' ? (
            <GoshuinPane visited={visited} />
          ) : (
            <TripsPane visited={visited} onOpenGoshuin={() => setView('goshuin')} />
          )}
        </View>
      </BottomSheet>

      {/*
        「＜」はシートの外。たたんだときのシートの左上あたりに浮かせる。
        シートの中に置くと、つまみが pointer を捕まえてタップが届かない。
      */}
      {view === 'goshuin' && !sheetOpen && (
        <Pressable
          onPress={backToMap}
          hitSlop={14}
          accessibilityLabel="back"
          style={[
            styles.back,
            { bottom: collapsed + 10, backgroundColor: palette.washiPaper, borderColor: palette.ruleStrong },
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={palette.ink} />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 北海道は地図の右上にあるので、その左隣＝左上が空いている
  countSlot: { position: 'absolute', left: 0, top: '4%' },
  // 地図の右端・上下中ほど（この高さは海しか無いので絵に重ならない）
  gaugeSlot: { position: 'absolute', right: -6, top: '26%' },
  // 丸ではなく、角を丸めた正方形。指で押しやすい大きさにする
  back: {
    position: 'absolute',
    left: space.lg,
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
});
