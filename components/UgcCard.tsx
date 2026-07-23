/**
 * UGCカードのプレビュー表現。実画像レンダリング(Skia)は後日実装のため、
 * ここでは配色と軌跡線でカードの「顔」を抽象的に示すプレースホルダ。
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { AppText } from './ui';
import { fonts, space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import type { GalleryCard } from '@/lib/mock';

const typeLabel: Record<GalleryCard['type'], string> = {
  route: '軌跡',
  goshuin: '御朱印',
  trip_summary: '旅サマリー',
};

// 疑似的な軌跡ライン
const trace = '10,80 25,60 38,66 52,40 66,48 78,24 92,30';

export function UgcCard({ card, width }: { card: GalleryCard; width: number }) {
  const { palette } = useTheme();
  const height = card.ratio === '9:16' ? (width * 16) / 9 : width;

  return (
    <View style={{ width }}>
      <View style={[styles.card, { height, backgroundColor: card.accent }]}>
        <Svg
          width="100%"
          height="55%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={styles.trace}
        >
          <Polyline
            points={trace}
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth={1.5}
          />
          <Circle cx={92} cy={30} r={3} fill="#fff" />
        </Svg>
        <View style={styles.top}>
          <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {typeLabel[card.type]} · {card.ratio}
          </AppText>
        </View>
        <View style={styles.bottom}>
          <AppText
            style={styles.title}
            numberOfLines={2}
          >
            {card.tripTitle}
          </AppText>
          <AppText variant="small" style={{ color: 'rgba(255,255,255,0.75)' }}>
            @{card.author}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 4,
    overflow: 'hidden',
    padding: space.md,
    justifyContent: 'space-between',
  },
  trace: { position: 'absolute', top: '20%', left: 0, right: 0, opacity: 0.9 },
  top: {},
  bottom: { gap: 2 },
  title: {
    fontFamily: fonts.minchoBold,
    fontSize: 18,
    lineHeight: 24,
    color: '#fff',
  },
});
