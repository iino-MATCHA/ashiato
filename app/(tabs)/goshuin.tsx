import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { AppText, Screen, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { Stamp } from '@/components/Stamp';
import { JapanSvgMap, visitedSlugs } from '@/components/JapanSvgMap';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { goshuinList, acquiredCount, PREFECTURE_TOTAL, trips } from '@/lib/mock';

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
  const visited = visitedSlugs(
    trips.flatMap((t) => t.prefectures),
    goshuinList.filter((g) => g.acquired).map((g) => g.prefectureName)
  );

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
        <LegendDot color={palette.shu} label="Visited" palette={palette} />
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
          <Pressable key={g.id} onPress={() => router.push(`/goshuin/${g.id}`)} style={styles.cell}>
            <Stamp goshuin={g} size={88} rotate={((i * 7) % 9) - 4} />
            <Gap h={space.sm} />
            <AppText variant="small" tone={g.acquired ? 'inkSoft' : 'inkFaint'} center numberOfLines={1}>{g.prefectureName}</AppText>
            {g.acquired && (g.rarity === 'limited' || g.rarity === 'collab') && (
              <AppText variant="eyebrow" tone="gold">LIMITED</AppText>
            )}
          </Pressable>
        ))}
      </View>

      <Gap h={space.xl} />
      <Rule />
      <Gap h={space.md} />
      <AppText variant="small" tone="inkFaint">
        Goshuin are stamped automatically when you check in to a prefecture on a trip. Seasonal and collaboration editions are only available for a limited time.
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
