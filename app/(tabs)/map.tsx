import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { ProgressArc } from '@/components/ProgressArc';
import { Stamp } from '@/components/Stamp';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import {
  goshuinList,
  acquiredCount,
  PREFECTURE_TOTAL,
  trips,
} from '@/lib/mock';

const regions = [
  { name: '北海道・東北', total: 7, done: 1 },
  { name: '関東', total: 7, done: 2 },
  { name: '中部', total: 9, done: 1 },
  { name: '近畿', total: 7, done: 2 },
  { name: '中国・四国', total: 9, done: 0 },
  { name: '九州・沖縄', total: 8, done: 2 },
];

export default function MapHome() {
  const { palette } = useTheme();
  const totalDistance = trips.reduce((s, t) => s + t.distanceKm, 0);
  const acquired = goshuinList.filter((g) => g.acquired);

  return (
    <Screen>
      <Gap h={space.md} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <AppText variant="eyebrow" tone="shu">日本 · 全国</AppText>
          <Gap h={space.xs} />
          <AppText variant="h2" tone="ink">わたしの足跡</AppText>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/profile')}>
          <View style={[styles.avatar, { backgroundColor: palette.fill }]}>
            <Ionicons name="person" size={18} color={palette.inkSoft} />
          </View>
        </Pressable>
      </Row>

      {/* 制覇率（主役） */}
      <Gap h={space.xl} />
      <View style={{ alignItems: 'center' }}>
        <ProgressArc value={acquiredCount} total={PREFECTURE_TOTAL} />
      </View>

      {/* 主要スタッツ — 箱ではなく縦罫で区切る */}
      <Gap h={space.xl} />
      <Row style={styles.stats}>
        <StatCell value={String(acquired.length)} label="御朱印" palette={palette} />
        <Rule vertical />
        <StatCell value={String(trips.length)} label="旅" palette={palette} />
        <Rule vertical />
        <StatCell
          value={totalDistance.toLocaleString()}
          unit="km"
          label="移動距離"
          palette={palette}
        />
      </Row>

      {/* 最近の御朱印 */}
      <Gap h={space.xl} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Eyebrow>最近いただいた御朱印</Eyebrow>
        <Pressable onPress={() => router.push('/(tabs)/goshuin')}>
          <AppText variant="small" tone="ai">すべて →</AppText>
        </Pressable>
      </Row>
      <Gap h={space.md} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -space.lg }}
        contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.lg }}
      >
        {acquired.map((g, i) => (
          <Pressable
            key={g.id}
            onPress={() => router.push(`/goshuin/${g.id}`)}
            style={{ alignItems: 'center', width: 92 }}
          >
            <Stamp goshuin={g} size={84} rotate={i % 2 === 0 ? -4 : 3} />
            <Gap h={space.sm} />
            <AppText variant="small" tone="inkSoft" center numberOfLines={1}>
              {g.prefectureName}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

      {/* 地方別の制覇 — 極細のバー */}
      <Gap h={space.xl} />
      <Eyebrow>地方別の制覇</Eyebrow>
      <Gap h={space.md} />
      {regions.map((r) => (
        <View key={r.name}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <AppText variant="body" tone="ink">{r.name}</AppText>
            <AppText variant="small" tone="inkFaint">
              {r.done} / {r.total}
            </AppText>
          </Row>
          <View style={[styles.track, { backgroundColor: palette.rule }]}>
            <View
              style={[
                styles.fill,
                {
                  backgroundColor: r.done > 0 ? palette.shu : 'transparent',
                  width: `${(r.done / r.total) * 100}%`,
                },
              ]}
            />
          </View>
          <Gap h={space.md} />
        </View>
      ))}

      <Gap h={space.md} />
      <Row style={{ gap: space.sm }}>
        <Ionicons name="information-circle-outline" size={15} color={palette.inkFaint} />
        <AppText variant="small" tone="inkFaint" style={{ flex: 1 }}>
          地図上の軌跡表示は、実機の地図（react-native-maps）連携で追加予定です。
        </AppText>
      </Row>
    </Screen>
  );
}

function StatCell({ value, unit, label, palette }: any) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Row style={{ alignItems: 'flex-end', gap: 2 }}>
        <AppText variant="h1" tone="ink">{value}</AppText>
        {unit && <AppText variant="small" tone="inkFaint" style={{ marginBottom: 6 }}>{unit}</AppText>}
      </Row>
      <AppText variant="eyebrow" tone="inkFaint">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { alignItems: 'center', height: 56 },
  track: { height: hairline * 3, width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
