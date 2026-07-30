/**
 * 御朱印。本物の御朱印にならい、
 *   下: 丸い印影（都道府県ごとの色・漢字一文字）
 *   上: 県名のひらがなを縦書きで、黒い筆文字
 * の二層で描く。印の上に墨が重なるのが御朱印の見え方なので、
 * 筆文字は印からわずかにはみ出させる。
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { prefectureColor, PREFECTURE_KANA_BY_ID } from '@/lib/prefectures';
import type { Goshuin } from '@/lib/mock';

const SUMI = '#1A1714'; // 墨（明るい地の上）
/**
 * 暗い地の上の墨書き。
 * 御朱印は紙を敷かずに地の上へ直接描いているので、墨のまま置くと
 * 暗いテーマで背景と同化して「とうきょう」「とちぎ」が読めなくなる。
 * 純白は目に刺さるので、生成り（未晒しの和紙の色）を使う。
 */
const SUMI_DARK = '#E8E0CE';

export function Stamp({
  goshuin,
  size = 92,
  rotate = 0,
}: {
  goshuin: Goshuin;
  size?: number;
  rotate?: number;
}) {
  const { palette, scheme } = useTheme();
  const acquired = goshuin.acquired;
  const seal = acquired ? prefectureColor(goshuin.prefectureId) : palette.rule;
  const kana = PREFECTURE_KANA_BY_ID[goshuin.prefectureId] ?? '';

  const c = size / 2;
  const outer = c - 3;
  const inner = c - 9;

  // 縦書きの字送り。文字数が多い県でも印からはみ出しすぎないよう詰める
  const chars = Array.from(kana);
  const step = Math.min(size * 0.185, (size * 0.96) / Math.max(chars.length, 1));
  const fontSize = step * 0.95;
  const top = c - (step * (chars.length - 1)) / 2;

  return (
    <View style={{ transform: [{ rotate: `${rotate}deg` }], opacity: acquired ? 1 : 0.5 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 印影 */}
        <G opacity={acquired ? 0.9 : 1}>
          <Circle cx={c} cy={c} r={outer} stroke={seal} strokeWidth={acquired ? 2.4 : 1} fill="none" />
          <Circle cx={c} cy={c} r={inner} stroke={seal} strokeWidth={acquired ? 1.1 : 0.6} fill="none" />
          <SvgText
            x={c}
            y={c + size * 0.155}
            fontSize={size * 0.44}
            fontFamily={fonts.minchoBold}
            fill={acquired ? seal : palette.inkFaint}
            textAnchor="middle"
            opacity={acquired ? 0.55 : 1}
          >
            {goshuin.kanji}
          </SvgText>
        </G>

        {/* 墨書き（縦） */}
        {acquired &&
          chars.map((ch, i) => (
            <SvgText
              key={i}
              x={c}
              y={top + i * step + fontSize * 0.34}
              fontSize={fontSize}
              fontFamily={fonts.brush}
              fill={scheme === 'dark' ? SUMI_DARK : SUMI}
              textAnchor="middle"
            >
              {ch}
            </SvgText>
          ))}
      </Svg>
    </View>
  );
}
