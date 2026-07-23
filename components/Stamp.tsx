/**
 * 御朱印スタンプ（丸印）。獲得済みは朱、未獲得は和紙に空押しのような淡い輪郭。
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import type { Goshuin } from '@/lib/mock';

export function Stamp({
  goshuin,
  size = 92,
  rotate = 0,
}: {
  goshuin: Goshuin;
  size?: number;
  rotate?: number;
}) {
  const { palette } = useTheme();
  const acquired = goshuin.acquired;
  const rarityColor =
    goshuin.rarity === 'limited' || goshuin.rarity === 'collab'
      ? palette.gold
      : palette.shu;
  const ink = acquired ? rarityColor : palette.rule;
  const c = size / 2;
  const outer = c - 3;
  const inner = c - 9;

  return (
    <View style={{ transform: [{ rotate: `${rotate}deg` }], opacity: acquired ? 1 : 0.55 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={c} cy={c} r={outer} stroke={ink} strokeWidth={acquired ? 2.4 : 1} fill="none" />
        <Circle cx={c} cy={c} r={inner} stroke={ink} strokeWidth={acquired ? 1.2 : 0.6} fill="none" />
        <SvgText
          x={c}
          y={c + size * 0.14}
          fontSize={size * 0.42}
          fontFamily={fonts.minchoBold}
          fill={acquired ? ink : palette.inkFaint}
          textAnchor="middle"
        >
          {goshuin.kanji}
        </SvgText>
      </Svg>
    </View>
  );
}
