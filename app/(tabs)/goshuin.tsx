import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { AppText, Screen, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { Stamp } from '@/components/Stamp';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { goshuinList, acquiredCount, PREFECTURE_TOTAL } from '@/lib/mock';
import { useVisitedPrefectures } from '@/lib/useData';

function rank(count: number) {
  if (count >= 47) return 'Grand Master';
  if (count >= 30) return 'Wayfarer';
  if (count >= 15) return 'Pilgrim';
  if (count >= 5) return 'On the Path';
  return 'First Steps';
}

export default function GoshuinBook() {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const { codes: visited } = useVisitedPrefectures();

  return (
    <Screen contentContainerStyle={{ paddingBottom: space.xxl }}>
      <Gap h={space.md} />
      <AppText variant="eyebrow" tone="shu">GOSHUIN · COLLECTION</AppText>
      <Gap h={space.sm} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <AppText variant="h1" tone="ink">Stamps of the{'\n'}47 Prefectures</AppText>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="display" tone="shu" style={{ lineHeight: 44 }}>{acquiredCount}</AppText>
          <AppText variant="small" tone="inkFaint">/ {PREFECTURE_TOTAL}</AppText>
        </View>
      </Row>

      {/* Coverage map — which prefectures you've reached */}
      <Gap h={space.lg} />
      <View style={{ alignItems: 'center' }}>
        <JapanSvgMap visited={visited} width={Math.min(width - space.lg * 2, 380)} />
      </View>
      <Gap h={space.xs} />
      <Row style={{ justifyContent: 'center', gap: space.lg }}>
        <LegendDot color={palette.matcha} label="Visited" palette={palette} />
        <LegendDot color={palette.fill} label="Not yet" palette={palette} border={palette.ruleStrong} />
      </Row>

      <Gap h={space.lg} />
      <Row style={[styles.rankBand, { borderColor: palette.ruleStrong }]}>
        <AppText variant="eyebrow" tone="inkFaint">Current rank</AppText>
        <AppText variant="h3" tone="ai">{rank(acquiredCount)}</AppText>
      </Row>

      <Gap h={space.xl} />
      <View style={styles.grid}>
        {goshuinList.map((g, i) => (
          <View key={g.id} style={styles.cell}>
            <Stamp goshuin={g} size={80} rotate={((i * 7) % 9) - 4} />
            <Gap h={space.sm} />
            <AppText variant="small" tone={g.acquired ? 'inkSoft' : 'inkFaint'} center numberOfLines={1}>{g.prefectureName}</AppText>
          </View>
        ))}
      </View>

      <Gap h={space.xl} />
      <Rule />
      <Gap h={space.md} />
      <AppText variant="small" tone="inkFaint">
        One goshuin per prefecture. A stamp is received automatically when you check in to that prefecture on a trip.
      </AppText>
    </Screen>
  );
}

function LegendDot({ color, label, palette, border }: any) {
  return (
    <Row style={{ gap: 6, alignItems: 'center' }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, borderWidth: border ? StyleSheet.hairlineWidth : 0, borderColor: border }} />
      <AppText variant="small" tone="inkFaint">{label}</AppText>
    </Row>
  );
}

const styles = StyleSheet.create({
  rankBand: { justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.xl },
  cell: { width: '30%', alignItems: 'center' },
});
