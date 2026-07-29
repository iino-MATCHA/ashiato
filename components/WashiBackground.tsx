/**
 * 和紙の質感。画像を持たず、SVGのノイズ（feTurbulence）と繊維状の線で作る。
 * 画像アセットを増やさずに済み、どの解像度でも粗さが出ない。
 */
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, Filter, FeTurbulence, FeColorMatrix, Rect, Line, G } from 'react-native-svg';
import { useTheme } from '@/lib/useTheme';

/** 紙の中に漉き込まれた繊維（毎回同じ配置になるよう決定的に散らす） */
function fibres(count: number, w: number, h: number) {
  const out: { x: number; y: number; len: number; rot: number; o: number }[] = [];
  let seed = 20260729;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < count; i++) {
    out.push({
      x: rnd() * w,
      y: rnd() * h,
      len: 8 + rnd() * 34,
      rot: rnd() * 180 - 90,
      o: 0.05 + rnd() * 0.09,
    });
  }
  return out;
}

const W = 400;
const H = 700;
const FIBRES = fibres(70, W, H);

export function WashiBackground({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { palette } = useTheme();
  const base = tone === 'dark' ? '#1E1B17' : '#FBF8F0';
  const fibre = tone === 'dark' ? '#8A8172' : '#8C7A5B';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: base }]} />
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs>
          {/* ざらつき */}
          <Filter id="washiNoise" x="0" y="0" width="100%" height="100%">
            <FeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={4} stitchTiles="stitch" />
            <FeColorMatrix type="saturate" values="0" />
          </Filter>
        </Defs>
        <Rect x="0" y="0" width={W} height={H} filter="url(#washiNoise)" opacity={tone === 'dark' ? 0.16 : 0.1} />
        {/* 繊維 */}
        <G>
          {FIBRES.map((f, i) => (
            <Line
              key={i}
              x1={f.x} y1={f.y}
              x2={f.x + Math.cos((f.rot * Math.PI) / 180) * f.len}
              y2={f.y + Math.sin((f.rot * Math.PI) / 180) * f.len}
              stroke={fibre}
              strokeWidth={0.7}
              strokeOpacity={f.o}
              strokeLinecap="round"
            />
          ))}
        </G>
        {/* 四隅を少し沈ませて紙の厚みを出す */}
        <Rect x="0" y="0" width={W} height={H} fill="none" stroke={palette.ruleStrong} strokeOpacity={0.14} strokeWidth={1} />
      </Svg>
    </View>
  );
}
