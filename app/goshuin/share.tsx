import { View, Pressable, StyleSheet, Share as RNShare, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { rankFor } from '@/components/RankModal';
import { space, fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useVisitedPrefectures } from '@/lib/useData';
import { PREFECTURE_TOTAL } from '@/lib/mock';

export default function GoshuinShare() {
  const { palette } = useTheme();
  const { width, height } = useWindowDimensions();
  const { codes: visited } = useVisitedPrefectures();
  const count = visited.length;
  const pct = Math.round((count / PREFECTURE_TOTAL) * 100);

  const cardW = Math.min(width - space.lg * 2, (height - 260) * 9 / 16, 340);
  const cardH = (cardW * 16) / 9;

  // カードは画面より小さいので、共通の型スケールをそのまま使うと文字が大きすぎる。
  // 幅に対する比率で決め直し、主役の「%」だけを大きく残す。
  const f = {
    eyebrow: cardW * 0.029,
    pct: cardW * 0.15,
    pctUnit: cardW * 0.034,
    label: cardW * 0.026,
    rank: cardW * 0.043,
    count: cardW * 0.072,
    countUnit: cardW * 0.030,
    mark: cardW * 0.040,
  };

  const share = async (to: string) => {
    const text = `I've visited ${count}/47 prefectures of Japan (${pct}%) — ${rankFor(count)} on Ashiato #ashiato`;
    if (to === 'x' && Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
      return;
    }
    try { await RNShare.share({ message: text }); } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title="Create a card" />
      <Rule />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
        <View style={[styles.card, { width: cardW, height: cardH, backgroundColor: palette.paper, borderColor: palette.rule }]}>
          <AppText
            style={{ fontFamily: fonts.gothicMedium, fontSize: f.eyebrow, letterSpacing: f.eyebrow * 0.28 }}
            tone="matcha"
          >
            MY JAPAN · ASHIATO
          </AppText>
          <Gap h={space.xs} />
          <Row style={{ alignItems: 'baseline', gap: 5 }}>
            <AppText style={{ fontFamily: fonts.minchoBold, fontSize: f.pct, lineHeight: f.pct * 1.06 }} tone="ink">
              {pct}%
            </AppText>
            <AppText style={{ fontFamily: fonts.gothicRegular, fontSize: f.pctUnit }} tone="inkFaint">of Japan</AppText>
          </Row>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <JapanSvgMap visited={visited} width={cardW - space.lg * 2} hideOkinawa />
          </View>

          {/* 幅を明示しないと両端が寄って文字が重なる */}
          <Row style={{ width: '100%', justifyContent: 'space-between', alignItems: 'flex-end', gap: space.sm }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText
                style={{ fontFamily: fonts.gothicMedium, fontSize: f.label, letterSpacing: f.label * 0.22 }}
                tone="inkFaint"
              >
                RANK
              </AppText>
              <AppText
                style={{ fontFamily: fonts.minchoBold, fontSize: f.rank }}
                tone="matcha"
                numberOfLines={1}
              >
                {rankFor(count)}
              </AppText>
            </View>
            <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
              <Row style={{ alignItems: 'baseline', gap: 3 }}>
                <AppText style={{ fontFamily: fonts.minchoBold, fontSize: f.count }} tone="ink">{count}</AppText>
                <AppText style={{ fontFamily: fonts.gothicRegular, fontSize: f.countUnit }} tone="inkFaint">/ 47</AppText>
              </Row>
              <AppText style={{ fontFamily: fonts.gothicRegular, fontSize: f.label }} tone="inkFaint">prefectures</AppText>
            </View>
          </Row>
          <Gap h={space.sm} />
          <AppText style={[styles.mark, { fontSize: f.mark }]} tone="inkFaint">足跡</AppText>
        </View>

        <Gap h={space.lg} />
        <Row style={{ gap: space.xl }}>
          <ExportBtn icon="download-outline" label="Save" onPress={() => share('save')} palette={palette} />
          <ExportBtn icon="logo-instagram" label="Stories" onPress={() => share('stories')} palette={palette} color="#C13584" />
          <ExportBtn icon="logo-twitter" label="X" onPress={() => share('x')} palette={palette} color={palette.ink} />
        </Row>
      </View>
    </SafeAreaView>
  );
}

function ExportBtn({ icon, label, onPress, palette, color }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ alignItems: 'center', opacity: pressed ? 0.6 : 1 }]}>
      <View style={[styles.exportCircle, { borderColor: palette.ruleStrong }]}>
        <Ionicons name={icon} size={22} color={color ?? palette.ink} />
      </View>
      <Gap h={4} />
      <AppText variant="small" tone="inkSoft">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // alignItems: 'center' を入れると子が内容幅に縮み、下段の両端揃えが効かなくなる
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: space.lg },
  mark: { fontFamily: fonts.minchoBold, alignSelf: 'center', opacity: 0.45 },
  exportCircle: { width: 54, height: 54, borderRadius: 27, borderWidth: StyleSheet.hairlineWidth * 2, alignItems: 'center', justifyContent: 'center' },
});
