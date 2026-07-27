import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View, Image, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { AppText, Screen, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { usePublicTrips } from '@/lib/useData';
import { searchTourismAreas, fetchTrendingAreas, type TourismArea } from '@/lib/api';
import { useRippleNav } from '@/lib/transition';
import { type Trip } from '@/lib/mock';
import { PREFECTURE_EN_BY_ID } from '@/lib/prefectures';

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
  const [q, setQ] = useState('');
  const [areas, setAreas] = useState<TourismArea[]>([]);
  const [trending, setTrending] = useState<TourismArea[]>([]);
  const [searching, setSearching] = useState(false);

  // Trending spots も DB（チェックイン数で並べた観光エリア）から引く
  useEffect(() => {
    let alive = true;
    fetchTrendingAreas(12).then((r) => { if (alive) setTrending(r); });
    return () => { alive = false; };
  }, []);

  // the search bar looks up tourism areas (tourism_area_master) and links to MATCHA
  useEffect(() => {
    const term = q.trim();
    if (!term) { setAreas([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const r = await searchTourismAreas(term);
      setAreas(r);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const openMatcha = (area: TourismArea) => {
    if (!area.matchaUrl) return;
    if (Platform.OS === 'web') {
      // web app: normal navigation in a new tab
      if (typeof window !== 'undefined') window.open(area.matchaUrl, '_blank');
    } else {
      // native: in-app browser
      WebBrowser.openBrowserAsync(area.matchaUrl);
    }
  };

  const featured = useMemo(() => weeklyFeatured(trips), [trips]);
  const friendTrips = trips.filter((t) => t.authorId && t.authorId !== 'me');
  const searchMode = q.trim().length > 0;

  return (
    <Screen>
      <Gap h={space.md} />
      <AppText variant="eyebrow" tone="matcha">EXPLORE</AppText>
      <Gap h={space.sm} />
      <AppText variant="h2" tone="ink">Get inspired by other travellers</AppText>

      <Gap h={space.lg} />
      <Row style={[styles.search, { borderColor: palette.ruleStrong }]}>
        <Ionicons name="search" size={18} color={palette.inkFaint} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search areas to explore (e.g. Shibuya, Kyoto)"
          placeholderTextColor={palette.inkFaint}
          style={[styles.searchInput, { color: palette.ink }]}
          autoCapitalize="none"
        />
        {searching && <ActivityIndicator size="small" color={palette.inkFaint} />}
        {!!q && !searching && (
          <Pressable onPress={() => setQ('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={palette.inkFaint} />
          </Pressable>
        )}
      </Row>

      {/* Search results — tourism areas, opening the matching MATCHA guide */}
      {searchMode && (
        <>
          <Gap h={space.lg} />
          <Eyebrow>Areas</Eyebrow>
          <Gap h={space.md} />
          <Rule />
          {areas.map((a) => (
            <View key={a.id}>
              <Pressable onPress={() => openMatcha(a)} style={({ pressed }) => [styles.areaRow, pressed && { opacity: 0.6 }]}>
                <Ionicons name="location-outline" size={18} color={palette.matcha} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" tone="ink">{a.name}</AppText>
                  <AppText variant="small" tone="inkFaint">
                    {a.nameJa}{a.municipality ? ` · ${a.municipality}` : ''}
                  </AppText>
                </View>
                <Row style={{ gap: 4, alignItems: 'center' }}>
                  <AppText variant="small" tone="matcha">MATCHA</AppText>
                  <Ionicons name="open-outline" size={14} color={palette.matcha} />
                </Row>
              </Pressable>
              <Rule />
            </View>
          ))}
          {!searching && areas.length === 0 && (
            <><Gap h={space.md} /><AppText variant="small" tone="inkFaint">No areas match “{q.trim()}”.</AppText></>
          )}
        </>
      )}

      {/* Featured — weekly */}
      {!searchMode && featured.length > 0 && (
        <>
          <Gap h={space.xl} />
          <Eyebrow>Featured journeys</Eyebrow>
          <Gap h={space.md} />
          <FeaturedCarousel trips={featured} palette={palette} screenW={width} />
        </>
      )}

      {/* From friends */}
      {!searchMode && friendTrips.length > 0 && (
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

      {/* Trending spots — 観光エリアをチェックイン数順に。タップでMATCHAへ。 */}
      {!searchMode && trending.length > 0 && (
        <>
          <Gap h={space.xl} />
          <Eyebrow>Trending spots</Eyebrow>
          <Gap h={space.md} />
          <Rule />
          {trending.map((a, i) => (
            <View key={a.id}>
              <Pressable onPress={() => openMatcha(a)} style={({ pressed }) => [styles.spot, pressed && { opacity: 0.6 }]}>
                <AppText variant="h3" tone="inkFaint" style={{ width: 30 }}>{String(i + 1).padStart(2, '0')}</AppText>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" tone="ink" numberOfLines={1}>{a.name}</AppText>
                  <AppText variant="small" tone="inkFaint" numberOfLines={1}>
                    {a.municipality}{a.prefectureCode ? ` · ${PREFECTURE_EN_BY_ID[a.prefectureCode] ?? ''}` : ''}
                  </AppText>
                </View>
                <Row style={{ gap: 4, alignItems: 'center' }}>
                  <AppText variant="small" tone="matcha">MATCHA</AppText>
                  <Ionicons name="open-outline" size={14} color={palette.matcha} />
                </Row>
              </Pressable>
              <Rule />
            </View>
          ))}
        </>
      )}
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
  spot: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  featureCover: { height: 240, borderRadius: 12, overflow: 'hidden', backgroundColor: '#ccc', justifyContent: 'flex-end' },
  featureText: { padding: space.lg },
  friendCover: { height: 150, borderRadius: 10, overflow: 'hidden', backgroundColor: '#ccc', justifyContent: 'flex-end' },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
});
