import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { GlobeMap } from '@/components/map/GlobeMap';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { trips, acquiredCount, PREFECTURE_TOTAL, type Trip } from '@/lib/mock';

const statusLabel: Record<Trip['status'], string> = {
  planning: 'Planning',
  ongoing: 'On the road',
  completed: 'Completed',
};

export default function Home() {
  const { palette } = useTheme();
  const ongoing = trips.filter((t) => t.status === 'ongoing');
  const past = trips.filter((t) => t.status !== 'ongoing');
  const pct = Math.round((acquiredCount / PREFECTURE_TOTAL) * 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space.xxl }}>
        {/* Rotating globe */}
        <GlobeMap height={320} />

        <View style={{ paddingHorizontal: space.lg }}>
          <Gap h={space.lg} />
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Eyebrow>Your journeys across Japan</Eyebrow>
              <Gap h={space.xs} />
              <AppText variant="h1" tone="ink">Your Trips</AppText>
            </View>
            <Pressable onPress={() => router.push('/trip/new')} hitSlop={8}>
              <View style={[styles.add, { borderColor: palette.ink }]}>
                <Ionicons name="add" size={22} color={palette.ink} />
              </View>
            </Pressable>
          </Row>

          {/* slim stats */}
          <Gap h={space.lg} />
          <Row style={{ alignItems: 'stretch' }}>
            <Stat value={`${pct}%`} label="Prefectures" palette={palette} />
            <Rule vertical />
            <Stat value={String(acquiredCount)} label="Goshuin" palette={palette} />
            <Rule vertical />
            <Stat value={String(trips.length)} label="Trips" palette={palette} />
          </Row>

          {/* Ongoing */}
          <Gap h={space.xl} />
          {ongoing.length > 0 && (
            <>
              <Eyebrow tone="inkFaint">On the road now</Eyebrow>
              <Gap h={space.md} />
              {ongoing.map((t) => (
                <Featured key={t.id} trip={t} palette={palette} />
              ))}
              <Gap h={space.xl} />
              <Eyebrow tone="inkFaint">Past trips</Eyebrow>
              <Gap h={space.sm} />
            </>
          )}

          <Rule />
          {past.map((t) => (
            <View key={t.id}>
              <TripRow trip={t} palette={palette} />
              <Rule />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Featured({ trip, palette }: { trip: Trip; palette: any }) {
  return (
    <Pressable onPress={() => router.push(`/trip/${trip.id}`)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.hero, { backgroundColor: palette.ai }]}>
        <Row style={{ gap: 6 }}>
          <View style={[styles.pulse, { backgroundColor: palette.shuSoft }]} />
          <AppText variant="eyebrow" style={{ color: palette.paper }}>
            {statusLabel[trip.status]} · {trip.subtitle}
          </AppText>
        </Row>
        <Gap h={space.md} />
        <AppText variant="h1" style={{ color: palette.paper }}>{trip.title}</AppText>
        <Gap h={space.md} />
        <Row style={{ gap: space.lg }}>
          <Mini value={String(trip.steps.length)} label="Stops" color={palette.paper} />
          <Mini value={`${trip.distanceKm}km`} label="Distance" color={palette.paper} />
          <Mini value={String(trip.members.length)} label="Travellers" color={palette.paper} />
        </Row>
      </View>
    </Pressable>
  );
}

function TripRow({ trip, palette }: { trip: Trip; palette: any }) {
  return (
    <Pressable onPress={() => router.push(`/trip/${trip.id}`)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <View style={{ flex: 1 }}>
        <AppText variant="small" tone="inkFaint">
          {trip.startDate.replace(/-/g, '.')} — {trip.prefectures.join(' · ')}
        </AppText>
        <Gap h={2} />
        <AppText variant="h3" tone="ink">{trip.title}</AppText>
        <Gap h={space.xs} />
        <Row style={{ gap: space.md }}>
          <Meta icon="footsteps-outline" text={`${trip.steps.length} stops`} palette={palette} />
          <Meta icon="navigate-outline" text={`${trip.distanceKm} km`} palette={palette} />
        </Row>
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
    </Pressable>
  );
}

function Stat({ value, label, palette }: any) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <AppText variant="h2" tone="ink">{value}</AppText>
      <AppText variant="eyebrow" tone="inkFaint">{label}</AppText>
    </View>
  );
}
function Mini({ value, label, color }: any) {
  return (
    <View>
      <AppText variant="h3" style={{ color }}>{value}</AppText>
      <AppText variant="eyebrow" style={{ color, opacity: 0.7 }}>{label}</AppText>
    </View>
  );
}
function Meta({ icon, text, palette }: any) {
  return (
    <Row style={{ gap: 4 }}>
      <Ionicons name={icon} size={13} color={palette.inkFaint} />
      <AppText variant="small" tone="inkFaint">{text}</AppText>
    </Row>
  );
}

const styles = StyleSheet.create({
  add: { width: 40, height: 40, borderRadius: 20, borderWidth: hairline * 2, alignItems: 'center', justifyContent: 'center' },
  hero: { padding: space.lg, borderRadius: 3 },
  pulse: { width: 7, height: 7, borderRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.lg, gap: space.md },
});
