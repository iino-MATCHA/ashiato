/**
 * Preview representation of a UGC card. High-res rendering (Skia) comes later;
 * here we sketch the card's "face" with colour and a trace line.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { AppText } from './ui';
import { fonts, space } from '@/lib/theme';
import type { GalleryCard } from '@/lib/mock';

const typeLabel: Record<GalleryCard['type'], string> = {
  route: 'Route',
  goshuin: 'Goshuin',
  trip_summary: 'Trip recap',
};

const trace = '10,80 25,60 38,66 52,40 66,48 78,24 92,30';

export function UgcCard({ card, width }: { card: GalleryCard; width: number }) {
  const height = card.ratio === '9:16' ? (width * 16) / 9 : width;

  return (
    <View style={{ width }}>
      <View style={[styles.card, { height, backgroundColor: card.accent }]}>
        <Svg width="100%" height="55%" viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.trace}>
          <Polyline points={trace} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} />
          <Circle cx={92} cy={30} r={3} fill="#fff" />
        </Svg>
        <View>
          <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {typeLabel[card.type]} · {card.ratio}
          </AppText>
        </View>
        <View style={{ gap: 2 }}>
          <AppText style={styles.title} numberOfLines={2}>{card.tripTitle}</AppText>
          <AppText variant="small" style={{ color: 'rgba(255,255,255,0.75)' }}>@{card.author}</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 4, overflow: 'hidden', padding: space.md, justifyContent: 'space-between' },
  trace: { position: 'absolute', top: '20%', left: 0, right: 0, opacity: 0.9 },
  title: { fontFamily: fonts.minchoBold, fontSize: 18, lineHeight: 24, color: '#fff' },
});
