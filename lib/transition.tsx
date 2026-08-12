import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { useTheme } from './useTheme';

/**
 * Ripple → white → fog-fade page transition.
 * Call navigate(href, event): a white circle ripples out from the tap point to
 * cover the screen, we navigate underneath, then the white "fog" fades away to
 * reveal the new screen. Only used where explicitly wired (trip/step opens).
 *
 * 旅（/trip/…）へ向かうときは**行き先の準備が終わるまで白を保つ**。
 * 以前は 420ms 待って剥がしていたが、地図のタイルや写真がまだで、
 * 半分描けた画面がカクカク見えていた（指摘を受けた）。行き先の画面が
 * markReady() を呼んだら剥がす。待っている間は白の上にくるくるを出す。
 * 呼び忘れ・読み込み失敗に備えて 6 秒で必ず剥がす。
 */
type Ctx = {
  navigate: (href: string, e?: GestureResponderEvent) => void;
  /** 行き先の画面が「描く準備ができた」と知らせる。遷移中でなければ何もしない */
  markReady: () => void;
};
const TransitionCtx = createContext<Ctx>({
  navigate: (href) => router.push(href as any),
  markReady: () => {},
});

export const useRippleNav = () => useContext(TransitionCtx);

const D = 64; // base circle diameter
/** markReady を待つ行き先。それ以外は今までどおり一拍で剥がす */
const WAITS_FOR_READY = /^\/trip\//;

const WEB = Platform.OS === 'web';

/**
 * 端末が「動きを減らす」を選んでいるか。判定できるのはWebだけ
 * （このアプリの演出はWeb専用なので、それで足りる）。
 */
export function usePrefersReducedMotion(): boolean {
  const canQuery = WEB && typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  const [reduced, setReduced] = useState(
    () => canQuery && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    if (!canQuery) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return reduced;
}

/** タブそのもの（バー付きで並ぶ4画面）。タブ間の切替は Tabs 側の
 *  cross-fade に任せる ―― ここで全体を透明にするとタブバーまで瞬く */
const TAB_ROUTES = /^\/(map|explore|goshuin|notifications)$/;

/** 描く前に走らせたい（1フレームでも素の切替を見せない）。SSRでは警告が出るので分ける */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * ページ間の fade-through（Web専用）。
 *
 * expo-router のスタックは Web ではアニメーションを持たず、経路が変わると
 * 画面がぶつ切りで差し替わる。ここで pathname の変化を拾い、新しい画面を
 * 「紙の地色 → ふわっと浮かび上がる」形で出す（不透明度 0→1、ほんの少しの
 * 拡大 0.98→1、220ms）。古い画面は既に居ないので、地色を一拍挟むことで
 * fade-through に見せる。地色はテーマの palette.washi ―― 白固定にすると
 * ダークモードで白が光る。
 *
 * やらないとき:
 *   - 初回表示（何かから遷移したわけではない）
 *   - prefers-reduced-motion
 *   - 白い幕（ripple → markReady）が上に居る間。/trip/* の握手はそのまま
 *   - タブ ↔ タブ。Tabs 側の cross-fade が受け持つ（バーを瞬かせない）
 */
function FadeThrough({
  covered,
  children,
}: {
  covered: React.MutableRefObject<boolean>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { palette } = useTheme();
  const reduced = usePrefersReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const prev = useRef<string | null>(null);
  // transform は掛けっぱなしにしない。scale(1) でも position:fixed の
  // 基準が狂う（LPなどが使っている）ので、動いている間だけ持つ
  const [animating, setAnimating] = useState(false);

  useIsoLayoutEffect(() => {
    const from = prev.current;
    prev.current = pathname;
    if (!WEB) return;
    if (from === null || from === pathname) return;
    if (reduced) return;
    if (covered.current) return;
    if (TAB_ROUTES.test(from) && TAB_ROUTES.test(pathname)) return;
    opacity.setValue(0);
    scale.setValue(0.98);
    setAnimating(true);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(scale, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start(({ finished }) => {
      if (finished) setAnimating(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ネイティブはスタック自体が遷移を持つので素通し
  if (!WEB) return <>{children}</>;

  return (
    // 透けている間に見える地。ここが紙色でないと暗所で白が光る
    <View style={{ flex: 1, backgroundColor: palette.washi }}>
      <Animated.View
        {...({ dataSet: { fadethrough: '1' } } as any)}
        style={{ flex: 1, opacity, ...(animating ? { transform: [{ scale }] } : null) }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const [active, setActive] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [origin, setOrigin] = useState({ x: width / 2, y: height / 2 });
  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const waiting = useRef(false);
  /** 白い幕が画面を覆っている間 true。FadeThrough が二重に演出しないための旗 */
  const covered = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const reveal = () => {
    waiting.current = false;
    clearTimers();
    setSpinner(false);
    Animated.timing(fade, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(
      () => {
        covered.current = false;
        setActive(false);
      }
    );
  };

  const markReady = () => {
    if (!waiting.current) return;
    // 届いた瞬間に剥がすと最後の1フレームを見せてしまう。ひと呼吸置く
    waiting.current = false;
    clearTimers();
    timers.current.push(setTimeout(reveal, 150));
  };

  const navigate = (href: string, e?: GestureResponderEvent) => {
    const ne: any = e?.nativeEvent;
    const x = typeof ne?.pageX === 'number' ? ne.pageX : width / 2;
    const y = typeof ne?.pageY === 'number' ? ne.pageY : height / 2;
    setOrigin({ x, y });
    scale.setValue(0);
    fade.setValue(1);
    covered.current = true;
    setActive(true);
    setSpinner(false);

    // circle must reach the farthest corner from the tap point
    const maxDist = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    const target = ((maxDist + 40) * 2) / D;

    Animated.timing(scale, { toValue: target, duration: 380, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      router.push(href as any);
      clearTimers();
      if (WAITS_FOR_READY.test(href)) {
        waiting.current = true;
        // すぐ終わる読み込みでくるくるを一瞬だけ光らせない
        timers.current.push(setTimeout(() => setSpinner(true), 300));
        // 保険。行き先が markReady を呼ばなくても白のまま置き去りにしない
        timers.current.push(setTimeout(reveal, 6000));
      } else {
        // hold the white cover a beat so the destination (map/tiles) can get ready,
        // then let the fog clear slowly — no half-drawn canvas is ever visible
        timers.current.push(setTimeout(reveal, 420));
      }
    });
  };

  return (
    <TransitionCtx.Provider value={{ navigate, markReady }}>
      <FadeThrough covered={covered}>{children}</FadeThrough>
      {active && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: fade, zIndex: 999 }]}>
          <Animated.View
            style={{
              position: 'absolute',
              left: origin.x - D / 2,
              top: origin.y - D / 2,
              width: D,
              height: D,
              borderRadius: D / 2,
              backgroundColor: '#fff',
              transform: [{ scale }],
            }}
          />
          {spinner && (
            <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
              <ActivityIndicator size="large" color="#69AF00" />
            </Animated.View>
          )}
        </Animated.View>
      )}
    </TransitionCtx.Provider>
  );
}
