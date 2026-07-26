import { View, Pressable, StyleSheet, Share as RNShare, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { ShareMap } from '@/components/map/ShareMap';
import { space, fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrip } from '@/lib/useData';

function daysBetween(a?: string, b?: string): number {
  if (!a || !b) return 0;
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
}

export default function TripShare() {
  const { palette } = useTheme();
  const { width, height } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip } = useTrip(id);

  if (!trip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">Loading…</AppText>
      </SafeAreaView>
    );
  }

  // 9:16 story card, sized to fit the screen
  const cardW = Math.min(width - space.lg * 2, (height - 260) * 9 / 16, 340);
  const cardH = (cardW * 16) / 9;

  const prefs = trip.prefectures.length;
  const days = daysBetween(trip.startDate, trip.endDate);
  const km = trip.distanceKm;

  const download = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const canvas = document.querySelector('canvas.mapboxgl-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    try {
      const link = document.createElement('a');
      link.download = `ashiato-${trip.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {}
  };
  const nativeShare = async (to: string) => {
    const text = `${trip.title} — ${prefs} prefectures, ${km} km with Ashiato #ashiato`;
    if (to === 'x' && Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
      return;
    }
    try { await RNShare.share({ message: text }); } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title="Share this trip" />
      <Rule />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
        {/* Story card */}
        <View style={[styles.card, { width: cardW, height: cardH }]}>
          <View style={StyleSheet.absoluteFill as any}>
            <ShareMap steps={trip.steps} height={cardH} />
          </View>
          {/* top + bottom scrims for legibility */}
          <View style={styles.topScrim} pointerEvents="none" />
          <View style={styles.bottomScrim} pointerEvents="none" />

          {/* title top-left */}
          <View style={styles.tl}>
            <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.85)' }}>ASHIATO</AppText>
            <Gap h={4} />
            <AppText style={styles.title} numberOfLines={3}>{trip.title}</AppText>
          </View>

          {/* stats bottom-left */}
          <View style={styles.bl}>
            <StatLine value={String(prefs)} label="prefectures visited" />
            <StatLine value={String(days)} label="days" />
            <StatLine value={`${km.toLocaleString()} km`} label="distance travelled" />
          </View>
        </View>

        {/* export buttons */}
        <Gap h={space.lg} />
        <Row style={{ gap: space.xl }}>
          <ExportBtn icon="download-outline" label="Save" onPress={download} palette={palette} />
          <ExportBtn icon="logo-instagram" label="Stories" onPress={() => nativeShare('stories')} palette={palette} color="#C13584" />
          <ExportBtn icon="logo-twitter" label="X" onPress={() => nativeShare('x')} palette={palette} color={palette.ink} />
        </Row>
      </View>
    </SafeAreaView>
  );
}

function StatLine({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Row style={{ alignItems: 'baseline', gap: 6 }}>
        <AppText style={styles.statValue}>{value}</AppText>
        <AppText style={styles.statLabel}>{label}</AppText>
      </Row>
    </View>
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
  card: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#0b1a2b' },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 140, backgroundColor: 'rgba(0,0,0,0.35)' },
  bottomScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, backgroundColor: 'rgba(0,0,0,0.45)' },
  tl: { position: 'absolute', top: space.md, left: space.md, right: space.md },
  title: { fontFamily: fonts.minchoBold, fontSize: 26, lineHeight: 32, color: '#fff' },
  bl: { position: 'absolute', bottom: space.md, left: space.md, right: space.md },
  statValue: { fontFamily: fonts.minchoBold, fontSize: 22, color: '#fff' },
  statLabel: { fontFamily: fonts.gothicRegular, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  exportCircle: { width: 54, height: 54, borderRadius: 27, borderWidth: StyleSheet.hairlineWidth * 2, alignItems: 'center', justifyContent: 'center' },
});
