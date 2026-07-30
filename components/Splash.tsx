import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { fonts, space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

/**
 * One-time intro shown before the login screen. Stylish and brief:
 * the wordmark fades/rises in, a matcha underline sweeps, then it dismisses.
 */
export function Splash({ onDone }: { onDone: () => void }) {
  const { palette } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;
  const line = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(rise, { toValue: 0, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(line, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.delay(500),
      Animated.timing(out, { toValue: 0, duration: 450, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => onDone());
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: palette.washi, opacity: out }]}>
      <Animated.Text style={[styles.brand, { color: palette.ink, opacity: fade, transform: [{ translateY: rise }] }]}>
        My Japan
      </Animated.Text>
      <View style={{ height: 10 }} />
      <Animated.View style={{ height: 2, backgroundColor: palette.matcha, opacity: fade, width: line.interpolate({ inputRange: [0, 1], outputRange: [0, 128] }) }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  // 「My Japan」は2文字の漢字より横に長いので、字を詰めて幅を抑える
  brand: { fontFamily: fonts.minchoBold, fontSize: 58, lineHeight: 70, letterSpacing: 1 },
  tag: { fontFamily: fonts.gothicMedium, fontSize: 12, letterSpacing: 5 },
});
