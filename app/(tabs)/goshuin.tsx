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
import { SignInPrompt } from '@/components/SignInPrompt';
import { useSession } from '@/lib/useSession';

export default function GoshuinBook() {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const { codes: visited } = useVisitedPrefectures();
  const { t } = useI18n();
  const visitedSet = new Set(visited);
  const count = visited.length;
  const [rankOpen, setRankOpen] = useState(false);
  // ゲストは 0/47 の白紙が出る。集めるにはログインが要る、と伝える
  const { guest } = useSession();
  const [askSignIn, setAskSignIn] = useState(false);

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
        </View>
      </Row>

      {/* Coverage map — which prefectures you've reached.
          ゲージは絶対配置にする。行の中に入れると見出しと地図が下へ押し出されるため。
          位置は地図の右端・中ほど（この高さのSVGは海しか無いので絵に重ならない）。 */}
      <Gap h={space.lg} />
      <View style={{ alignItems: 'center' }}>
        <JapanSvgMap visited={visited} width={Math.min(width - space.lg * 2, 380)} okinawaInset />
        <View style={styles.gaugeSlot} pointerEvents="box-none">
          <CoverageGauge visitedCodes={visited} total={PREFECTURE_TOTAL} />
        </View>
      </View>
      <Gap h={space.xs} />
      <Row style={{ justifyContent: 'center', gap: space.lg }}>
        <LegendDot color={palette.matcha} label={t('goshuin.visited')} palette={palette} />
        <LegendDot color={palette.mapEmpty} label={t('goshuin.notYet')} palette={palette} border={palette.ruleStrong} />
      </Row>

      {/* ゲストの帳面は真っ白なので、なぜ空なのかをここで言う */}
      {guest && (
        <>
          <Gap h={space.lg} />
          <Rule />
          <Pressable onPress={() => setAskSignIn(true)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <Row style={{ gap: space.sm, alignItems: 'center', paddingVertical: space.md }}>
              <Ionicons name="footsteps-outline" size={18} color={palette.matcha} />
              <AppText variant="small" tone="inkSoft" style={{ flex: 1, lineHeight: 20 }}>
                {t('guest.goshuinBody')}
              </AppText>
              <Ionicons name="chevron-forward" size={16} color={palette.inkFaint} />
            </Row>
          </Pressable>
          <Rule />
        </>
      )}

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
      <Button
        label={t('goshuin.share')}
        tone="matcha"
        onPress={() => (guest ? setAskSignIn(true) : router.push('/goshuin/share'))}
      />
      <SignInPrompt visible={askSignIn} onClose={() => setAskSignIn(false)} reason="collect" />

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
  // 地図の右端・上下中ほど。行の高さに影響させないため絶対配置
  gaugeSlot: { position: 'absolute', right: 0, top: '26%' },
  rankBand: { justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.xl },
  cell: { width: '30%', alignItems: 'center' },
});
