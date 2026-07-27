import { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Gap, Rule } from '@/components/ui';
import { GlobeMap } from '@/components/map/GlobeMap';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { PREFECTURE_TOTAL, type Trip } from '@/lib/mock';
import { useTrips, usePublicTrips, useVisitedPrefectures } from '@/lib/useData';
import { useProfile } from '@/lib/useProfile';
import { isSupabaseConfigured } from '@/lib/supabase';
import { deleteTrip } from '@/lib/api';
import { useRippleNav } from '@/lib/transition';

const statusLabel: Record<Trip['status'], string> = {
  planning: 'Planning',
  ongoing: 'On the road',
  completed: 'Completed',
};

export default function Home() {
  const { palette } = useTheme();
  const { trips } = useTrips();
  const { trips: publicTrips } = usePublicTrips();
  const { profile } = useProfile();
  const { codes: visited } = useVisitedPrefectures();
  const [menuTrip, setMenuTrip] = useState<Trip | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const pct = Math.round((visited.length / PREFECTURE_TOTAL) * 100);
  let ordered = [...trips]
    .filter((t) => !deletedIds.has(t.id))
    .sort((a, b) => (a.status === 'ongoing' ? -1 : b.status === 'ongoing' ? 1 : 0));
  // keep the official sample pinned at the top (read-only, from the DB demo user)
  if (isSupabaseConfigured) {
    const sample = publicTrips.find((t) => t.authorId !== 'me' && t.title === 'Japan Grand Tour');
    if (sample && !ordered.some((t) => t.id === sample.id)) {
      ordered = [{ ...sample, sample: true }, ...ordered];
    }
  }

  const onDelete = async () => {
    const t = menuTrip;
    setMenuTrip(null);
    if (!t) return;
    setDeletedIds((cur) => new Set(cur).add(t.id));
    if (isSupabaseConfigured) await deleteTrip(t.id);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space.xxl }}>
        {/* Rotating globe */}
        <GlobeMap height={300} />

        <View style={{ paddingHorizontal: space.lg }}>
          {/* Profile row — links to the profile page */}
          <Gap h={space.md} />
          <Pressable onPress={() => router.push('/profile')} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
            <Row style={{ gap: space.md, alignItems: 'center' }}>
              <View style={[styles.avatar, { backgroundColor: palette.fill, borderColor: palette.matcha, borderWidth: 2, overflow: 'hidden' }]}>
                {profile.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
                ) : (
                  <Ionicons name="person" size={22} color={palette.matcha} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" tone="ink">{profile.name}</AppText>
                <AppText variant="small" tone="inkFaint">@{profile.username}</AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
            </Row>
          </Pressable>

          <Gap h={space.lg} />
          <Rule />
          <Gap h={space.lg} />
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="h2" tone="ink">Your Trips</AppText>
            <Pressable onPress={() => router.push('/trip/new')} hitSlop={8}>
              <Row style={{ gap: 5, alignItems: 'center' }}>
                <Ionicons name="add-circle" size={22} color={palette.matcha} />
                <AppText variant="bodyStrong" tone="matcha">New</AppText>
              </Row>
            </Pressable>
          </Row>

          {/* slim inline stats */}
          <Gap h={space.sm} />
          <Row style={{ gap: space.lg }}>
            <InlineStat value={`${pct}%`} label="of Japan" palette={palette} />
            <InlineStat value={String(visited.length)} label="goshuin" palette={palette} />
            <InlineStat value={String(trips.filter((t) => !t.sample).length)} label="trips" palette={palette} />
          </Row>

          <Gap h={space.lg} />
          {ordered.map((t) => (
            <TripCard key={t.id} trip={t} palette={palette} onEdit={() => setMenuTrip(t)} />
          ))}
        </View>
      </ScrollView>

      {/* Trip actions (own, non-sample trips) */}
      <Modal visible={!!menuTrip} transparent animationType="fade" onRequestClose={() => setMenuTrip(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setMenuTrip(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: palette.washi }]} onPress={() => {}}>
            <AppText variant="h3" tone="ink" numberOfLines={1}>{menuTrip?.title}</AppText>
            <Gap h={space.md} />
            <Pressable onPress={() => { const t = menuTrip; setMenuTrip(null); if (t) router.push(`/trip/${t.id}/edit`); }} style={styles.menuRow}>
              <Ionicons name="create-outline" size={20} color={palette.ink} />
              <AppText variant="body" tone="ink">Edit trip details</AppText>
            </Pressable>
            <Rule />
            <Pressable onPress={onDelete} style={styles.menuRow}>
              <Ionicons name="trash-outline" size={20} color={palette.shu} />
              <AppText variant="body" tone="shu">Delete trip</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function isOnTheRoad(trip: Trip): boolean {
  if (!trip.startDate || !trip.endDate) return false;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return trip.startDate <= today && today <= trip.endDate;
}

function TripCard({ trip, palette, onEdit }: { trip: Trip; palette: any; onEdit: () => void }) {
  const { navigate } = useRippleNav();
  const cover = trip.steps[0]?.images[0];
  const ongoing = isOnTheRoad(trip);
  const mine = trip.authorId === 'me' || !trip.authorId;
  const editable = !trip.sample && mine; // sample & others' trips can't be edited/deleted
  const href = `/trip/${trip.id}${editable ? '' : '?readonly=1'}`;
  return (
    <Pressable onPress={(e) => navigate(href, e)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.cover}>
        {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />}
        <View style={styles.coverShade} />
        {ongoing && (
          <View style={[styles.pill, { backgroundColor: palette.matcha }]}>
            <View style={styles.pulse} />
            <AppText variant="eyebrow" style={{ color: '#fff' }}>On the road</AppText>
          </View>
        )}
        {trip.sample && (
          <View style={[styles.pill, { backgroundColor: 'rgba(43,66,87,0.9)' }]}>
            <Ionicons name="sparkles-outline" size={11} color="#fff" />
            <AppText variant="eyebrow" style={{ color: '#fff' }}>Sample</AppText>
          </View>
        )}
        {editable && (
          <Pressable onPress={onEdit} hitSlop={10} style={styles.cardMenu}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
          </Pressable>
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
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardMenu: { position: 'absolute', top: space.sm, right: space.sm, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  sheet: { width: '100%', maxWidth: 360, padding: space.lg, borderRadius: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
});
