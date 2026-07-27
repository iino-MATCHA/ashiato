import React, { createContext, useContext, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import { router } from 'expo-router';

/**
 * Ripple → white → fog-fade page transition.
 * Call navigate(href, event): a white circle ripples out from the tap point to
 * cover the screen, we navigate underneath, then the white "fog" fades away to
 * reveal the new screen. Only used where explicitly wired (trip/step opens).
 */
type Ctx = { navigate: (href: string, e?: GestureResponderEvent) => void };
const TransitionCtx = createContext<Ctx>({ navigate: (href) => router.push(href as any) });

export const useRippleNav = () => useContext(TransitionCtx);

const D = 64; // base circle diameter

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const [active, setActive] = useState(false);
  const [origin, setOrigin] = useState({ x: width / 2, y: height / 2 });
  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  const navigate = (href: string, e?: GestureResponderEvent) => {
    const ne: any = e?.nativeEvent;
    const x = typeof ne?.pageX === 'number' ? ne.pageX : width / 2;
    const y = typeof ne?.pageY === 'number' ? ne.pageY : height / 2;
    setOrigin({ x, y });
    scale.setValue(0);
    fade.setValue(1);
    setActive(true);

    // circle must reach the farthest corner from the tap point
    const maxDist = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    const target = ((maxDist + 40) * 2) / D;

    Animated.timing(scale, { toValue: target, duration: 380, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      router.push(href as any);
      // hold the white cover a beat so the destination (map/tiles) can get ready,
      // then let the fog clear slowly — no half-drawn canvas is ever visible
      setTimeout(() => {
        Animated.timing(fade, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => setActive(false));
      }, 420);
    });
  };

  return (
    <TransitionCtx.Provider value={{ navigate }}>
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
        </Animated.View>
      )}
    </TransitionCtx.Provider>
  );
}
