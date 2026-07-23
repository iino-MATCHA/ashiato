import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppText, Screen, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { Stamp } from '@/components/Stamp';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { goshuinList, acquiredCount, PREFECTURE_TOTAL } from '@/lib/mock';

function rank(count: number) {
  if (count >= 47) return 'Grand Master';
  if (count >= 30) return 'Wayfarer';
  if (count >= 15) return 'Pilgrim';
  if (count >= 5) return 'On the Path';
  return 'First Steps';
}

export default function GoshuinBook() {
  const { palette } = useTheme();

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

const styles = StyleSheet.create({
  rankBand: { justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.xl },
  cell: { width: '30%', alignItems: 'center' },
});
