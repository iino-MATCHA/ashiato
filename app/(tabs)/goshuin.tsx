import { useState } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { Stamp } from '@/components/Stamp';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { RankModal, rankFor } from '@/components/RankModal';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { goshuinList, PREFECTURE_TOTAL } from '@/lib/mock';
import { useVisitedPrefectures } from '@/lib/useData';
import { WashiBackground } from '@/components/WashiBackground';
import { CoverageGauge } from '@/components/CoverageGauge';
import { CountUp } from '@/components/CountUp';
import { useI18n } from '@/lib/i18n';

export default function GoshuinBook() {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const { codes: visited } = useVisitedPrefectures();
  const { t } = useI18n();
  const visitedSet = new Set(visited);
  const count = visited.length;
  const [rankOpen, setRankOpen] = useState(false);

  return (
    <Screen contentContainerStyle={{ paddingBottom: space.xxl }} background={<WashiBackground />}>
      <Gap h={space.md} />
      <AppText variant="eyebrow" tone="shu">GOSHUIN · COLLECTION</AppText>
      <Gap h={space.sm} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <AppText variant="h1" tone="ink">{t('goshuin.heading1')}{'\n'}{t('goshuin.heading2')}</AppText>
        <View style={{ alignItems: 'flex-end' }}>
          <CountUp value={count} variant="display" tone="shu" style={{ lineHeight: 44 }} />
          <AppText variant="small" tone="inkFaint">/ {PREFECTURE_TOTAL}</AppText>
          <Gap h={space.sm} />
          {/* タップで地方ごとの内訳へ */}
          <CoverageGauge visitedCodes={visited} total={PREFECTURE_TOTAL} />
        </View>
      </Row>

      {/* Coverage map — which prefectures you've reached */}
      <Gap h={space.lg} />
      <View style={{ alignItems: 'center' }}>
        <JapanSvgMap visited={visited} width={Math.min(width - space.lg * 2, 380)} okinawaInset />
      </View>
      <Gap h={space.xs} />
      <Row style={{ justifyContent: 'center', gap: space.lg }}>
        <LegendDot color={palette.matcha} label={t('goshuin.visited')} palette={palette} />
        <LegendDot color={palette.fill} label={t('goshuin.notYet')} palette={palette} border={palette.ruleStrong} />
      </Row>

      <Gap h={space.lg} />
      <Pressable onPress={() => setRankOpen(true)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
        <Row style={[styles.rankBand, { borderColor: palette.ruleStrong }]}>
          <AppText variant="eyebrow" tone="inkFaint">{t('goshuin.rank')}</AppText>
          <Row style={{ gap: 6, alignItems: 'center' }}>
            <AppText variant="h3" tone="ai">{rankFor(count)}</AppText>
            <Ionicons name="information-circle-outline" size={16} color={palette.inkFaint} />
          </Row>
        </Row>
      </Pressable>
      <RankModal visible={rankOpen} onClose={() => setRankOpen(false)} count={count} />

      {/* ランクのすぐ下に置く。スタンプを見終わってからでは気づかれにくい */}
      <Gap h={space.md} />
      <Button label={t('goshuin.share')} tone="matcha" onPress={() => router.push('/goshuin/share')} />

      <Gap h={space.xl} />
      <View style={styles.grid}>
        {goshuinList.map((g, i) => {
          const acquired = visitedSet.has(g.prefectureId);
          return (
            <View key={g.id} style={styles.cell}>
              <Stamp goshuin={{ ...g, acquired }} size={80} rotate={((i * 7) % 9) - 4} />
              <Gap h={space.sm} />
              <AppText variant="small" tone={acquired ? 'inkSoft' : 'inkFaint'} center numberOfLines={1}>{g.prefectureName}</AppText>
            </View>
          );
        })}
      </View>

      <Gap h={space.lg} />
      <Rule />
      <Gap h={space.md} />
      <AppText variant="small" tone="inkFaint">
        {t('goshuin.footNote')}
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
