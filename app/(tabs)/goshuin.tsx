import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppText, Screen, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { Stamp } from '@/components/Stamp';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { goshuinList, acquiredCount, PREFECTURE_TOTAL } from '@/lib/mock';

/** 獲得数から称号を決める。 */
function rank(count: number) {
  if (count >= 47) return '満願成就';
  if (count >= 30) return '行脚の達人';
  if (count >= 15) return '巡礼者';
  if (count >= 5) return '道半ば';
  return '旅のはじまり';
}

export default function GoshuinBook() {
  const { palette } = useTheme();

  return (
    <Screen contentContainerStyle={{ paddingBottom: space.xxl }}>
      <Gap h={space.md} />
      <AppText variant="eyebrow" tone="shu">御朱印帳 · COLLECTION</AppText>
      <Gap h={space.sm} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <AppText variant="h1" tone="ink">四十七の{'\n'}御朱印</AppText>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="display" tone="shu" style={{ lineHeight: 44 }}>
            {acquiredCount}
          </AppText>
          <AppText variant="small" tone="inkFaint">／ {PREFECTURE_TOTAL}</AppText>
        </View>
      </Row>

      {/* 称号 */}
      <Gap h={space.lg} />
      <Row
        style={[styles.rankBand, { borderColor: palette.ruleStrong }]}
      >
        <AppText variant="eyebrow" tone="inkFaint">現在の称号</AppText>
        <AppText variant="h3" tone="ai">{rank(acquiredCount)}</AppText>
      </Row>

      {/* スタンプのグリッド（和紙に押した趣） */}
      <Gap h={space.xl} />
      <View style={styles.grid}>
        {goshuinList.map((g, i) => (
          <Pressable
            key={g.id}
            onPress={() => router.push(`/goshuin/${g.id}`)}
            style={styles.cell}
          >
            <Stamp goshuin={g} size={88} rotate={((i * 7) % 9) - 4} />
            <Gap h={space.sm} />
            <AppText
              variant="small"
              tone={g.acquired ? 'inkSoft' : 'inkFaint'}
              center
              numberOfLines={1}
            >
              {g.prefectureName}
            </AppText>
            {g.acquired && (g.rarity === 'limited' || g.rarity === 'collab') && (
              <AppText variant="eyebrow" tone="gold">限定</AppText>
            )}
          </Pressable>
        ))}
      </View>

      <Gap h={space.xl} />
      <Rule />
      <Gap h={space.md} />
      <AppText variant="small" tone="inkFaint">
        御朱印は、旅のStepで訪れた都道府県を選ぶと自動で記帳されます。季節限定・コラボ版は期間中のみいただけます。
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rankBand: {
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space.xl,
  },
  cell: { width: '30%', alignItems: 'center' },
});
