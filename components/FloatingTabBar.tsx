/**
 * 画面下に浮かぶタブバー。
 *
 * 選ばれているアイコンの後ろに水玉を敷き、タブを移ると水玉が
 * その位置まで滑っていく（iPhoneのアプリでよく見るあれ）。
 *
 * 動かし方は CSS の transition に任せる。
 * この土台の Animated は Web で走らないことがあり（シートで実測）、
 * 途中で止まると、水玉がどのタブにも属さない場所に取り残される。
 * 位置は素の style に入れて確定させ、間だけブラウザに繋がせる。
 * 演出が動かなくても、水玉は必ず選ばれているタブの上にある。
 */
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hairline, space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

const WEB = Platform.OS === 'web';

const TAB_CSS = `
[data-mjdot="1"] { transition: left .32s cubic-bezier(.2,.8,.2,1); }
`;
let cssInjected = false;
function injectTabCss() {
  if (!WEB || cssInjected || typeof document === 'undefined') return;
  cssInjected = true;
  const tag = document.createElement('style');
  tag.textContent = TAB_CSS;
  document.head.appendChild(tag);
}

/** タブの並び順に対応するアイコン。ここに無い経路はバーに出さない */
const ICONS: Record<string, any> = {
  map: 'earth-outline',
  explore: 'compass-outline',
  notifications: 'notifications-outline',
};

const BAR_H = 62;
// 丸ではなく角の丸いチップ。横に広いぶん、アイコンの左右に余白が残る
const DOT_W = 54;
const DOT_H = 38;

/**
 * バーの地の透け具合。
 * Webは backdrop-filter のぼかしが効くので大きく透かせる（後ろの地図や
 * 写真が磨りガラス越しに見える）。ネイティブはぼかしが無いので、
 * 透かしすぎると文字や写真がアイコンと直接ぶつかる。控えめに留める
 */
const BAR_ALPHA = WEB ? 0.6 : 0.88;

/** '#RRGGBB' → 'rgba(...)'。テーマの紙色をそのまま透かすため */
function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  injectTabCss();

  // バーに出す経路だけを、宣言された順で拾う
  const routes = useMemo(() => state.routes.filter((r) => ICONS[r.name]), [state.routes]);
  const activeIndex = Math.max(0, routes.findIndex((r) => r.key === state.routes[state.index]?.key));

  /**
   * 位置は**割合**で置く。ピクセルで計算しようとすると、
   * useWindowDimensions が 0 を返したり onLayout が呼ばれなかったりして
   * 水玉がバーの外へ飛んだ（どちらも実測）。
   * 区画の幅を割合で持てば、何も測らずに必ず正しい位置に来る。
   */
  const cells = Math.max(1, routes.length);
  const cellPct = 100 / cells;

  return (
    <View
      style={[
        styles.bar,
        {
          bottom: Math.max(insets.bottom, 10),
          backgroundColor: withAlpha(palette.washi, BAR_ALPHA),
          borderColor: palette.rule,
        },
        // 透かした地の後ろをぼかして、アイコンの可読性を保つ（Webのみ）
        WEB &&
          ({
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          } as any),
      ]}
    >
      {/* 水玉。区画ぶんの枠を左へずらし、その中で中央に丸を置く */}
      <View
        {...(WEB ? ({ dataSet: { mjdot: '1' } } as any) : null)}
        pointerEvents="none"
        style={[styles.dotSlot, { width: `${cellPct}%`, left: `${cellPct * activeIndex}%` }]}
      >
        <View style={[styles.dot, { backgroundColor: palette.fill }]} />
      </View>

      {routes.map((route, i) => {
        const focused = i === activeIndex;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name as never);
            }}
            style={styles.item}
          >
            <Ionicons
              name={ICONS[route.name]}
              size={23}
              // 生成り。inkFaint だと暗い地に沈んで読めなかった
              color={focused ? palette.matcha : palette.kinari}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    height: BAR_H,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: hairline,
    // 浮いて見えるように影を落とす
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  // 一区画ぶんの枠。これを割合で動かす
  dotSlot: { position: 'absolute', top: 0, height: BAR_H, alignItems: 'center', justifyContent: 'center' },
  dot: { width: DOT_W, height: DOT_H, borderRadius: 13 },
  item: { flex: 1, height: BAR_H, alignItems: 'center', justifyContent: 'center' },
});
