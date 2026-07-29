import React, { createContext, useContext, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import { router } from 'expo-router';

/**
 * 画面遷移の演出。
 *
 * navigate(href, e)
 *   タップ点から白い円が広がって画面を覆い、その裏で遷移し、霧が晴れる。
 *
 * navigatePhoto(href, e, uri, rect)
 *   一覧カードの写真が、そのまま地図のピンの大きさまで縮んで着地する。
 *   「同じものを見ている」感覚を出すための共有要素トランジション。
 *   着地点は TripMap がアクティブなピンを置く位置（画面中央よりやや上）に合わせてある。
 */
export interface SourceRect { x: number; y: number; width: number; height: number }

type Ctx = {
  navigate: (href: string, e?: GestureResponderEvent) => void;
  navigatePhoto: (href: string, uri: string | undefined, rect: SourceRect | null, e?: GestureResponderEvent) => void;
};
const TransitionCtx = createContext<Ctx>({
  navigate: (href) => router.push(href as any),
  navigatePhoto: (href) => router.push(href as any),
});

export const useRippleNav = () => useContext(TransitionCtx);

const D = 64; // base circle diameter
const PIN = 52; // TripMap のピンの直径に合わせる

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const [active, setActive] = useState(false);
  const [origin, setOrigin] = useState({ x: width / 2, y: height / 2 });
  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  // --- 写真がピンに着地する遷移 ---
  const [photo, setPhoto] = useState<{ uri: string; rect: SourceRect } | null>(null);
  const fly = useRef(new Animated.Value(0)).current;   // 0: カードの位置 → 1: ピンの位置
  const photoFade = useRef(new Animated.Value(1)).current;

  const navigatePhoto = (
    href: string,
    uri: string | undefined,
    rect: SourceRect | null,
    e?: GestureResponderEvent
  ) => {
    if (!uri || !rect) return navigate(href, e); // 写真が無ければ従来の波紋で
    setPhoto({ uri, rect });
    fly.setValue(0);
    photoFade.setValue(1);
    fade.setValue(1);
    scale.setValue(0);
    setActive(true);

    Animated.sequence([
      Animated.timing(fly, { toValue: 1, duration: 520, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
      Animated.timing(photoFade, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();

    // 写真が飛んでいる間に遷移し、着地に合わせて覆いを消す
    setTimeout(() => router.push(href as any), 430);
    setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true })
        .start(() => { setActive(false); setPhoto(null); });
    }, 780);
  };

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

  // 着地点: TripMap がアクティブなピンを置くあたり（bottomInset 240 の 1/6 だけ上）
  const targetX = width / 2;
  const targetY = height / 2 - 40;

  return (
    <TransitionCtx.Provider value={{ navigate, navigatePhoto }}>
      {children}

      {/* カードの写真 → 地図のピン */}
      {active && photo && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 1000, opacity: photoFade }]}>
          <Animated.View
            style={{
              position: 'absolute',
              left: photo.rect.x,
              top: photo.rect.y,
              width: photo.rect.width,
              height: photo.rect.height,
              transform: [
                {
                  translateX: fly.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, targetX - (photo.rect.x + photo.rect.width / 2)],
                  }),
                },
                {
                  translateY: fly.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, targetY - (photo.rect.y + photo.rect.height / 2)],
                  }),
                },
                { scale: fly.interpolate({ inputRange: [0, 1], outputRange: [1, PIN / photo.rect.width] }) },
              ],
            }}
          >
            <Animated.View
              style={{
                flex: 1,
                overflow: 'hidden',
                // 角丸をカードの形から円へ。scale と釣り合うよう逆算した値を使う
                borderRadius: fly.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, (photo.rect.width / (PIN / photo.rect.width)) / 2],
                }) as any,
                borderWidth: fly.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 3 / (PIN / photo.rect.width)] }) as any,
                borderColor: '#fff',
              }}
            >
              <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      )}

      {active && !photo && (
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

      {/* 写真が飛ぶときは、着地に合わせて暗い地を薄く敷いて地図の描画を隠す */}
      {active && photo && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: '#0d1b2a', opacity: fade, zIndex: 999 }]}
        />
      )}
    </TransitionCtx.Provider>
  );
}
