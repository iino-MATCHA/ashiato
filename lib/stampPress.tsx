/**
 * 御朱印が「押される」演出。
 *
 * 新しい都道府県にチェックインしたときだけ出す。印が上から降りてきて紙に当たり、
 * わずかに沈んでから弾み、朱色が縁からにじむ。0.4秒で決める。
 * どこからでも呼べるよう、Provider + imperative な関数で持つ。
 */
import React, { createContext, useContext, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, Platform } from 'react-native';
import { AppText, Gap } from '@/components/ui';
import { Stamp } from '@/components/Stamp';
import { PREFECTURE_EN_BY_ID, PREFECTURE_KANJI_BY_ID } from '@/lib/prefectures';
import { useTheme } from '@/lib/useTheme';
import { space, fonts } from '@/lib/theme';

type Ctx = { pressStamp: (prefectureCode: number) => void };
const StampCtx = createContext<Ctx>({ pressStamp: () => {} });
export const useStampPress = () => useContext(StampCtx);

export function StampPressProvider({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  const [code, setCode] = useState<number | null>(null);

  // 0: 上に浮いて大きい → 1: 紙に当たる → 2: 弾んで静止
  const drop = useRef(new Animated.Value(0)).current;
  const veil = useRef(new Animated.Value(0)).current;
  const ink = useRef(new Animated.Value(0)).current;   // にじみ
  const shake = useRef(new Animated.Value(0)).current; // 着弾の震え
  const label = useRef(new Animated.Value(0)).current;

  const pressStamp = (prefectureCode: number) => {
    if (!prefectureCode) return;
    setCode(prefectureCode);
    drop.setValue(0); veil.setValue(0); ink.setValue(0); shake.setValue(0); label.setValue(0);

    Animated.sequence([
      Animated.timing(veil, { toValue: 1, duration: 180, useNativeDriver: true }),
      // 落下 → 着弾（少しめり込む）
      Animated.timing(drop, { toValue: 1, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.parallel([
        // 一度だけ短く震える
        Animated.sequence([
          Animated.timing(shake, { toValue: 1, duration: 45, useNativeDriver: true }),
          Animated.timing(shake, { toValue: -1, duration: 45, useNativeDriver: true }),
          Animated.timing(shake, { toValue: 0, duration: 45, useNativeDriver: true }),
        ]),
        // 沈み込みから弾んで静止
        Animated.spring(drop, { toValue: 2, friction: 5, tension: 140, useNativeDriver: true }),
        // 朱がにじむ
        Animated.timing(ink, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.timing(label, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(1100),
      Animated.parallel([
        Animated.timing(veil, { toValue: 0, duration: 340, useNativeDriver: true }),
        Animated.timing(label, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]),
    ]).start(() => setCode(null));
  };

  const kanji = code ? PREFECTURE_KANJI_BY_ID[code] ?? '' : '';
  const en = code ? PREFECTURE_EN_BY_ID[code] ?? '' : '';

  // 落下: 上から。着弾で 0.94 まで沈み、弾んで 1.0
  const translateY = drop.interpolate({ inputRange: [0, 1, 2], outputRange: [-190, 0, 0] });
  const scale = drop.interpolate({ inputRange: [0, 1, 2], outputRange: [1.9, 0.94, 1] });
  const stampOpacity = drop.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0.5, 1] });
  const shakeX = shake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-5, 0, 5] });
  const inkScale = ink.interpolate({ inputRange: [0, 1], outputRange: [0.75, 2.5] });
  const inkOpacity = ink.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.34, 0] });

  return (
    <StampCtx.Provider value={{ pressStamp }}>
      {children}
      {code !== null && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 1000, opacity: veil }]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(12,10,8,0.72)' }]} />
          <Animated.View style={[styles.center, { transform: [{ translateX: shakeX }] }]}>
            {/* 紙 */}
            <View style={[styles.paper, { backgroundColor: '#FBF8F0' }]}>
              {/* にじみ */}
              <Animated.View
                style={[
                  styles.ink,
                  { opacity: inkOpacity, transform: [{ scale: inkScale }], backgroundColor: palette.shu },
                ]}
              />
              <Animated.View style={{ opacity: stampOpacity, transform: [{ translateY }, { scale }] }}>
                <Stamp
                  goshuin={{ id: 'press', prefectureId: code, prefectureName: en, kanji, acquired: true } as any}
                  size={132}
                />
              </Animated.View>
            </View>

            <Animated.View
              style={{
                opacity: label,
                transform: [{ translateY: label.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                alignItems: 'center',
              }}
            >
              <Gap h={space.lg} />
              <AppText style={{ fontFamily: fonts.gothicMedium, fontSize: 10, letterSpacing: 4, color: 'rgba(255,255,255,0.62)' }}>
                GOSHUIN EARNED
              </AppText>
              <Gap h={6} />
              <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 26, color: '#fff' }}>{en}</AppText>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      )}
    </StampCtx.Provider>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  paper: {
    width: 210, height: 210, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 18px 50px rgba(0,0,0,0.45)' } as any,
      default: { shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 26, shadowOffset: { width: 0, height: 16 }, elevation: 14 },
    }),
  },
  ink: { position: 'absolute', width: 120, height: 120, borderRadius: 60 },
});
