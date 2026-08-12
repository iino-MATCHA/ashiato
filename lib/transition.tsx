import React, { createContext, useContext, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import { router } from 'expo-router';

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

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const [active, setActive] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [origin, setOrigin] = useState({ x: width / 2, y: height / 2 });
  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const waiting = useRef(false);
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
      () => setActive(false)
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
      {children}
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
