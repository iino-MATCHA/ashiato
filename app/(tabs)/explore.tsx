import { View, Image, Pressable, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { usePublicTrips } from '@/lib/useData';
import { trendingSpots, type Trip } from '@/lib/mock';

export default function Explore() {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const { trips } = usePublicTrips();
  const colW = (width - space.lg * 2 - space.md) / 2;

  const feature = trips[0];
  const rest = trips.slice(1);
  const left = rest.filter((_, i) => i % 2 === 0);
  const right = rest.filter((_, i) => i % 2 === 1);

  return (
    <Screen>
      <Gap h={space.md} />
      <AppText variant="eyebrow" tone="matcha">EXPLORE</AppText>
      <Gap h={space.sm} />
      <AppText variant="h2" tone="ink">Get inspired by other travellers</AppText>

      <Gap h={space.lg} />
      <Row style={[styles.search, { borderColor: palette.ruleStrong }]}>
        <Ionicons name="search" size={18} color={palette.inkFaint} />
        <TextInput placeholder="Search places, spots, people" placeholderTextColor={palette.inkFaint} style={[styles.searchInput, { color: palette.ink }]} />
      </Row>

      {/* Featured public trip */}
      {feature && (
        <>
          <Gap h={space.xl} />
          <Eyebrow>Featured journey</Eyebrow>
          <Gap h={space.md} />
          <FeatureCard trip={feature} palette={palette} />
        </>
      )}

      {/* Trending spots */}
      <Gap h={space.xl} />
      <Eyebrow>Trending spots</Eyebrow>
      <Gap h={space.md} />
      <Rule />
      {trendingSpots.map((s, i) => (
        <View key={s.name}>
          <Row style={styles.spot}>
            <AppText variant="h3" tone="inkFaint" style={{ width: 30 }}>{String(i + 1).padStart(2, '0')}</AppText>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" tone="ink">{s.name}</AppText>
              <AppText variant="small" tone="inkFaint">{s.prefecture}</AppText>
            </View>
            <Row style={{ gap: 4 }}>
              <Ionicons name="footsteps-outline" size={13} color={palette.matcha} />
              <AppText variant="small" tone="matcha">{s.visits.toLocaleString()}</AppText>
            </Row>
          </Row>
          <Rule />
        </View>
      ))}

      {/* More public trips */}
      {rest.length > 0 && (
        <>
          <Gap h={space.xl} />
          <Eyebrow>More journeys</Eyebrow>
          <Gap h={space.md} />
          <Row style={{ alignItems: 'flex-start', gap: space.md }}>
            <View style={{ gap: space.md, flex: 1 }}>
              {left.map((t) => <MiniCard key={t.id} trip={t} width={colW} palette={palette} />)}
            </View>
            <View style={{ gap: space.md, flex: 1 }}>
              {right.map((t) => <MiniCard key={t.id} trip={t} width={colW} palette={palette} />)}
            </View>
          </Row>
        </>
      )}
    </Screen>
  );
}

function FeatureCard({ trip, palette }: { trip: Trip; palette: any }) {
  const cover = trip.steps[0]?.images[0];
  return (
    <Pressable onPress={() => router.push(`/trip/${trip.id}?readonly=1`)} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      <View style={styles.featureCover}>
        {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />}
        <View style={styles.shade} />
        <View style={styles.featureText}>
          <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.85)' }}>{trip.prefectures.slice(0, 4).join(' · ')}</AppText>
          <Gap h={4} />
          <AppText variant="h1" style={{ color: '#fff' }} numberOfLines={2}>{trip.title}</AppText>
          <Gap h={space.xs} />
          <Row style={{ gap: space.md }}>
            <Meta icon="footsteps-outline" text={`${trip.steps.length} stops`} />
            <Meta icon="navigate-outline" text={`${trip.distanceKm} km`} />
            <Meta icon="person-circle-outline" text={trip.members[0] ?? 'Traveller'} />
          </Row>
        </View>
      </View>
    </Pressable>
  );
}

function MiniCard({ trip, width, palette }: { trip: Trip; width: number; palette: any }) {
  const cover = trip.steps[0]?.images[0];
  return (
    <Pressable onPress={() => router.push(`/trip/${trip.id}?readonly=1`)}>
      <View style={[styles.miniCover, { width, height: width * 1.15 }]}>
        {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />}
        <View style={styles.shade} />
        <View style={{ padding: space.sm }}>
          <AppText variant="bodyStrong" style={{ color: '#fff' }} numberOfLines={2}>{trip.title}</AppText>
          <AppText variant="small" style={{ color: 'rgba(255,255,255,0.8)' }}>@{(trip.members[0] ?? 'traveller').toLowerCase()}</AppText>
        </View>
      </View>
    </Pressable>
  );
}

function Meta({ icon, text }: any) {
  return (
    <Row style={{ gap: 4 }}>
      <Ionicons name={icon} size={13} color="rgba(255,255,255,0.85)" />
      <AppText variant="small" style={{ color: 'rgba(255,255,255,0.85)' }}>{text}</AppText>
    </Row>
  );
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', gap: space.sm, borderBottomWidth: hairline * 2, paddingBottom: space.sm },
  searchInput: { flex: 1, fontFamily: fonts.gothicRegular, fontSize: type.body, paddingVertical: 4 },
  spot: { alignItems: 'center', gap: space.md, paddingVertical: space.md },
  featureCover: { height: 240, borderRadius: 12, overflow: 'hidden', backgroundColor: '#ccc', justifyContent: 'flex-end' },
  featureText: { padding: space.lg },
  miniCover: { borderRadius: 10, overflow: 'hidden', backgroundColor: '#ccc', justifyContent: 'flex-end' },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
});
