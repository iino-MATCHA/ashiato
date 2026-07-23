/**
 * 制覇率の円弧。ホームの主役。箱を使わず、大きな数字と細い弧で見せる。
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppText } from './ui';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

export function ProgressArc({
  value,
  total,
  size = 200,
}: {
  value: number;
  total: number;
  size?: number;
}) {
  const { palette } = useTheme();
  const stroke = 3;
  const r = size / 2 - stroke * 2;
  const circumference = 2 * Math.PI * r;
  const pct = value / total;
  const c = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={c} cy={c} r={r} stroke={palette.rule} strokeWidth={stroke} fill="none" />
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke={palette.shu}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference * pct} ${circumference}`}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </Svg>
      <AppText variant="display" tone="ink">
        {Math.round(pct * 100)}
        <AppText variant="h2" tone="inkFaint">
          ％
        </AppText>
      </AppText>
      <View style={{ height: space.xs }} />
      <AppText variant="eyebrow" tone="inkFaint">
        {value} / {total} 都道府県
      </AppText>
    </View>
  );
}
