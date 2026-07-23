import { View, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Gap } from '@/components/ui';
import { GlobeMap } from '@/components/map/GlobeMap';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { acquiredCount, PREFECTURE_TOTAL, type Trip } from '@/lib/mock';
import { useTrips } from '@/lib/useData';

const statusLabel: Record<Trip['status'], string> = {
  planning: 'Planning',
  ongoing: 'On the road',
  completed: 'Completed',
};

export default function Home() {
  const { palette } = useTheme();
  const { trips } = useTrips();
  const pct = Math.round((acquiredCount / PREFECTURE_TOTAL) * 100);
  const ordered = [...trips].sort((a, b) => (a.status === 'ongoing' ? -1 : b.status === 'ongoing' ? 1 : 0));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space.xxl }}>
        {/* Rotating globe */}
        <GlobeMap height={300} />

        <View style={{ paddingHorizontal: space.lg }}>
          <Gap h={space.lg} />
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="h2" tone="ink">Your Trips</AppText>
            <Pressable onPress={() => router.push('/trip/new')} hitSlop={8}>
              <Row style={{ gap: 5, alignItems: 'center' }}>
                <Ionicons name="add-circle" size={22} color={palette.shu} />
                <AppText variant="bodyStrong" tone="shu">New</AppText>
              </Row>
            </Pressable>
          </Row>

          {/* slim inline stats */}
          <Gap h={space.sm} />
          <Row style={{ gap: space.lg }}>
            <InlineStat value={`${pct}%`} label="of Japan" palette={palette} />
            <InlineStat value={String(acquiredCount)} label="goshuin" palette={palette} />
            <InlineStat value={String(trips.length)} label="trips" palette={palette} />
          </Row>

          <Gap h={space.lg} />
          {ordered.map((t) => (
            <TripCard key={t.id} trip={t} palette={palette} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TripCard({ trip, palette }: { trip: Trip; palette: any }) {
  const cover = trip.steps[0]?.images[0];
  const ongoing = trip.status === 'ongoing';
  return (
    <Pressable onPress={() => router.push(`/trip/${trip.id}`)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.cover}>
        {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />}
        <View style={styles.coverShade} />
        {ongoing && (
          <View style={[styles.pill, { backgroundColor: palette.shu }]}>
            <View style={styles.pulse} />
            <AppText variant="eyebrow" style={{ color: '#fff' }}>{statusLabel[trip.status]}</AppText>
          </View>
        )}
        <View style={styles.coverText}>
          <AppText variant="h2" style={{ color: '#fff' }} numberOfLines={2}>{trip.title}</AppText>
          <AppText variant="small" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {trip.startDate.replace(/-/g, '.')} · {trip.subtitle}
          </AppText>
        </View>
      </View>
      <Row style={{ gap: space.lg, paddingVertical: space.md }}>
        <Meta icon="footsteps-outline" text={`${trip.steps.length} stops`} palette={palette} />
        <Meta icon="navigate-outline" text={`${trip.distanceKm} km`} palette={palette} />
        <Meta icon="people-outline" text={`${trip.members.length}`} palette={palette} />
        <View style={{ flex: 1 }} />
        <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
      </Row>
    </Pressable>
  );
}

function InlineStat({ value, label, palette }: any) {
  return (
    <Row style={{ alignItems: 'baseline', gap: 4 }}>
      <AppText variant="h3" tone="ink">{value}</AppText>
      <AppText variant="small" tone="inkFaint">{label}</AppText>
    </Row>
  );
}
function Meta({ icon, text, palette }: any) {
  return (
    <Row style={{ gap: 4 }}>
      <Ionicons name={icon} size={14} color={palette.inkFaint} />
      <AppText variant="small" tone="inkSoft">{text}</AppText>
    </Row>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.lg },
  cover: { height: 200, borderRadius: 10, overflow: 'hidden', backgroundColor: '#ddd', justifyContent: 'flex-end' },
  coverShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  coverText: { padding: space.md, gap: 2 },
  pill: { position: 'absolute', top: space.md, left: space.md, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
});
