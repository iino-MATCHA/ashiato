import { useCallback, useRef, useState } from 'react';
import { View, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Screen, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useRippleNav } from '@/lib/transition';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchUserProfile, fetchTripsByOwner, fetchVisitedPrefecturesOf, type UserSummary } from '@/lib/api';
import { RankModal, rankFor } from '@/components/RankModal';
import { findFriend, allTrips, PREFECTURE_TOTAL, type Trip } from '@/lib/mock';
import { PREFECTURE_EN_BY_ID } from '@/lib/prefectures';

export default function FriendProfile() {
  const { palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [visitedCodes, setVisitedCodes] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankOpen, setRankOpen] = useState(false);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured || !id) {
      const f = findFriend(id);
      setUser({ id: f.id, name: f.name, username: f.username, avatarUrl: '' });
      setTrips(allTrips.filter((t) => t.authorId === f.id));
      setLoading(false);
      return;
    }
    Promise.all([fetchUserProfile(id), fetchTripsByOwner(id), fetchVisitedPrefecturesOf(id)])
      .then(([u, t, v]) => { if (alive.current) { setUser(u); setTrips(t); setVisitedCodes(v); } })
      .catch(() => {})
      .finally(() => alive.current && setLoading(false));
  }, [id]);
  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));

  // the friend's real visited prefectures (RPC: onboarding + their trips);
  // fall back to what's derivable from their visible trips
  const visitedSet = new Set<number>(visitedCodes);
  if (visitedSet.size === 0) {
    trips.forEach((t) => t.prefectures.forEach((n) => { const i = PREFECTURE_EN_BY_ID.indexOf(n); if (i > 0) visitedSet.add(i); }));
  }
  const goshuin = visitedSet.size;
  const pct = Math.round((goshuin / PREFECTURE_TOTAL) * 100);

  if (loading || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.matcha} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top']}>
      <Header title={user.name} />
      <Screen edges={[]}>
        <Gap h={space.sm} />
        <Row style={{ gap: space.md, alignItems: 'center' }}>
          <View style={[styles.avatar, { backgroundColor: palette.fill }]}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
            ) : (
              <Ionicons name="person" size={28} color={palette.matcha} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="h2" tone="ink">{user.name}</AppText>
            <AppText variant="small" tone="inkFaint">@{user.username}</AppText>
            <Gap h={6} />
            <Pressable onPress={() => setRankOpen(true)} style={[styles.rankPill, { borderColor: palette.matcha }]}>
              <Ionicons name="ribbon-outline" size={13} color={palette.matcha} />
              <AppText variant="small" tone="matcha">{rankFor(goshuin)}</AppText>
            </Pressable>
          </View>
        </Row>
        <RankModal visible={rankOpen} onClose={() => setRankOpen(false)} count={goshuin} />

        <Gap h={space.lg} />
        <Row style={{ alignItems: 'stretch' }}>
          <Stat value={`${pct}%`} label="of Japan" />
          <Rule vertical />
          <Stat value={String(goshuin)} label="Goshuin" />
          <Rule vertical />
          <Stat value={String(trips.length)} label="Trips" />
        </Row>

        <Gap h={space.xl} />
        <Eyebrow>Their trips</Eyebrow>
        <Gap h={space.md} />
        {trips.map((t) => (
          <FriendTripCard key={t.id} trip={t} />
        ))}
        {trips.length === 0 && (
          <AppText variant="small" tone="inkFaint">No trips they've shared with you yet.</AppText>
        )}
      </Screen>
    </SafeAreaView>
  );
}

function FriendTripCard({ trip }: { trip: Trip }) {
  const { navigate } = useRippleNav();
  const cover = trip.steps[0]?.images[0];
  return (
    <Pressable onPress={(e) => navigate(`/trip/${trip.id}?readonly=1`, e)} style={styles.card}>
      <View style={styles.cover}>
        {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />}
        <View style={styles.shade} />
        <View style={{ padding: space.md }}>
          <AppText variant="h3" style={{ color: '#fff' }} numberOfLines={1}>{trip.title}</AppText>
          <AppText variant="small" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {trip.startDate.replace(/-/g, '.')} · {trip.subtitle}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

function Stat({ value, label }: any) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: space.sm }}>
      <AppText variant="h2" tone="ink">{value}</AppText>
      <AppText variant="eyebrow" tone="inkFaint">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  rankPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, borderWidth: hairline * 2, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  card: { marginBottom: space.md },
  cover: { height: 150, borderRadius: 10, overflow: 'hidden', backgroundColor: '#ccc', justifyContent: 'flex-end' },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
});
