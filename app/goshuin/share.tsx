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
          <AppText variant="eyebrow" tone="matcha">MY JAPAN · ASHIATO</AppText>
          <Gap h={space.xs} />
          <Row style={{ alignItems: 'baseline', gap: 6 }}>
            <AppText variant="display" tone="ink" style={{ lineHeight: 44 }}>{pct}%</AppText>
            <AppText variant="body" tone="inkFaint">of Japan</AppText>
          </Row>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <JapanSvgMap visited={visited} width={cardW - space.lg * 2} hideOkinawa />
          </View>

          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <AppText variant="eyebrow" tone="inkFaint">Rank</AppText>
              <AppText variant="h3" tone="matcha">{rankFor(count)}</AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="h2" tone="ink">{count}<AppText variant="small" tone="inkFaint"> / 47</AppText></AppText>
              <AppText variant="small" tone="inkFaint">prefectures</AppText>
            </View>
          </Row>
          <Gap h={space.sm} />
          <AppText style={styles.mark} tone="inkFaint">足跡</AppText>
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
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: space.lg, alignItems: 'center' },
  mark: { fontFamily: fonts.minchoBold, fontSize: 18, alignSelf: 'center', opacity: 0.5 },
  exportCircle: { width: 54, height: 54, borderRadius: 27, borderWidth: StyleSheet.hairlineWidth * 2, alignItems: 'center', justifyContent: 'center' },
});
