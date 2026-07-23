import { View, Image, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Screen, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { findFriend, allTrips, type Trip } from '@/lib/mock';

export default function FriendProfile() {
  const { palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const friend = findFriend(id);
  const trips = allTrips.filter((t) => t.authorId === friend.id);
  const totalStops = trips.reduce((s, t) => s + t.steps.length, 0);
  const totalKm = trips.reduce((s, t) => s + t.distanceKm, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top']}>
      <Header title={friend.name} />
      <Screen edges={[]}>
        <Gap h={space.sm} />
        <Row style={{ gap: space.md, alignItems: 'center' }}>
          <View style={[styles.avatar, { backgroundColor: friend.color }]}>
            <AppText variant="h2" style={{ color: '#fff' }}>{friend.name.slice(0, 1)}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="h2" tone="ink">{friend.name}</AppText>
            <AppText variant="small" tone="inkFaint">@{friend.username}</AppText>
          </View>
          <View style={[styles.friendBadge, { borderColor: palette.matcha }]}>
            <Ionicons name="checkmark" size={13} color={palette.matcha} />
            <AppText variant="small" tone="matcha">Friends</AppText>
          </View>
        </Row>

        <Gap h={space.lg} />
        <Row style={{ alignItems: 'stretch' }}>
          <Stat value={String(trips.length)} label="Trips" palette={palette} />
          <Rule vertical />
          <Stat value={String(totalStops)} label="Stops" palette={palette} />
          <Rule vertical />
          <Stat value={`${totalKm}`} label="km" palette={palette} />
        </Row>

        <Gap h={space.xl} />
        <Eyebrow>Their trips</Eyebrow>
        <Gap h={space.md} />
        {trips.map((t) => (
          <FriendTripCard key={t.id} trip={t} palette={palette} />
        ))}
        {trips.length === 0 && (
          <AppText variant="small" tone="inkFaint">No public trips yet.</AppText>
        )}

        <Gap h={space.md} />
        <Row style={{ gap: 6 }}>
          <Ionicons name="lock-closed-outline" size={13} color={palette.inkFaint} />
          <AppText variant="small" tone="inkFaint">You can view their trips on the map, but not edit them.</AppText>
        </Row>
      </Screen>
    </SafeAreaView>
  );
}

function FriendTripCard({ trip, palette }: { trip: Trip; palette: any }) {
  const cover = trip.steps[0]?.images[0];
  return (
    <Pressable onPress={() => router.push(`/trip/${trip.id}?readonly=1`)} style={styles.card}>
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

function Stat({ value, label, palette }: any) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: space.sm }}>
      <AppText variant="h2" tone="ink">{value}</AppText>
      <AppText variant="eyebrow" tone="inkFaint">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  friendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: hairline * 2, paddingHorizontal: space.md, paddingVertical: 6, borderRadius: 999 },
  card: { marginBottom: space.md },
  cover: { height: 150, borderRadius: 10, overflow: 'hidden', backgroundColor: '#ccc', justifyContent: 'flex-end' },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
});
