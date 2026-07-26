import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { usePublicTrips } from '@/lib/useData';
import { useRippleNav } from '@/lib/transition';
import { trendingSpots, type Trip } from '@/lib/mock';

/**
 * Featured ranking + weekly rotation.
 * score favours big, well-documented journeys (distance + stops + prefectures).
 * The list is then rotated by the ISO-ish week number so the top pick changes
 * roughly once a week, keeping Explore fresh without manual curation.
 */
function weeklyFeatured(trips: Trip[]): Trip[] {
  const score = (t: Trip) => t.distanceKm * 0.01 + t.steps.length * 3 + t.prefectures.length * 2;
  const ranked = [...trips].sort((a, b) => score(b) - score(a));
  if (ranked.length < 2) return ranked;
  const week = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
  const offset = week % ranked.length;
  return [...ranked.slice(offset), ...ranked.slice(0, offset)];
}

export default function Explore() {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const { trips } = usePublicTrips();

  const featured = useMemo(() => weeklyFeatured(trips), [trips]);
  const friendTrips = trips.filter((t) => t.authorId && t.authorId !== 'me');

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

      {/* Featured — weekly */}
      {featured.length > 0 && (
        <>
          <Gap h={space.xl} />
          <Eyebrow>Featured journeys</Eyebrow>
          <Gap h={space.md} />
          <FeaturedCarousel trips={featured} palette={palette} screenW={width} />
        </>
      )}

      {/* From friends */}
      {friendTrips.length > 0 && (
        <>
          <Gap h={space.xl} />
          <Eyebrow>From your friends</Eyebrow>
          <Gap h={space.md} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg }} contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.md }}>
            {friendTrips.map((t) => (
              <FriendCard key={t.id} trip={t} palette={palette} />
            ))}
          </ScrollView>
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
    </Screen>
  );
}

function FeaturedCarousel({ trips, palette, screenW }: { trips: Trip[]; palette: any; screenW: number }) {
  const { navigate } = useRippleNav();
  const ref = useRef<ScrollView | null>(null);
  const [idx, setIdx] = useState(0);
  const cardW = screenW - space.lg * 2;
  const SNAP = cardW + space.md;

  useEffect(() => {
    if (trips.length < 2) return;
    const t = setInterval(() => {
      setIdx((cur) => {
        const next = (cur + 1) % trips.length;
        ref.current?.scrollTo({ x: next * SNAP, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(t);
  }, [trips.length, SNAP]);

  return (
    <View>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / SNAP))}
        contentContainerStyle={{ gap: space.md }}
      >
        {trips.map((t) => {
          const cover = t.steps[0]?.images[0];
          return (
            <Pressable key={t.id} onPress={(e) => navigate(`/trip/${t.id}?readonly=1`, e)} style={{ width: cardW }}>
              <View style={[styles.featureCover, { width: cardW }]}>
                {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />}
                <View style={styles.shade} />
                <View style={styles.featureText}>
                  <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.85)' }}>{t.prefectures.slice(0, 4).join(' · ')}</AppText>
                  <Gap h={4} />
                  <AppText variant="h1" style={{ color: '#fff' }} numberOfLines={2}>{t.title}</AppText>
                  <Gap h={space.xs} />
                  <Row style={{ gap: space.md }}>
                    <Meta icon="footsteps-outline" text={`${t.steps.length} stops`} />
                    <Meta icon="navigate-outline" text={`${t.distanceKm} km`} />
                    <Meta icon="person-circle-outline" text={t.members[0] ?? 'Traveller'} />
                  </Row>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <Row style={{ justifyContent: 'center', gap: 6, marginTop: space.sm }}>
        {trips.map((_, i) => (
          <View key={i} style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === idx ? palette.matcha : palette.rule }} />
        ))}
      </Row>
    </View>
  );
}

function FriendCard({ trip, palette }: { trip: Trip; palette: any }) {
  const { navigate } = useRippleNav();
  const cover = trip.steps[0]?.images[0];
  return (
    <Pressable onPress={(e) => navigate(`/trip/${trip.id}?readonly=1`, e)} style={{ width: 200 }}>
      <View style={styles.friendCover}>
        {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />}
        <View style={styles.shade} />
        <View style={{ padding: space.sm }}>
          <AppText variant="bodyStrong" style={{ color: '#fff' }} numberOfLines={1}>{trip.title}</AppText>
          <AppText variant="small" style={{ color: 'rgba(255,255,255,0.85)' }}>@{(trip.members[0] ?? 'traveller').toLowerCase()}</AppText>
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
  friendCover: { height: 150, borderRadius: 10, overflow: 'hidden', backgroundColor: '#ccc', justifyContent: 'flex-end' },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
});
