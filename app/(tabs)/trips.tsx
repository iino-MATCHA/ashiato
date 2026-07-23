import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, Row, Rule, Gap } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { trips, type Trip } from '@/lib/mock';

const statusLabel: Record<Trip['status'], string> = {
  planning: '計画中',
  ongoing: '進行中',
  completed: '完了',
};

export default function Trips() {
  const { palette } = useTheme();
  const ongoing = trips.filter((t) => t.status === 'ongoing');
  const rest = trips.filter((t) => t.status !== 'ongoing');

  return (
    <Screen>
      <Gap h={space.md} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <AppText variant="eyebrow" tone="shu">TIMELINE</AppText>
          <Gap h={space.xs} />
          <AppText variant="h2" tone="ink">旅の記録</AppText>
        </View>
        <Pressable
          onPress={() => router.push('/trip/new')}
          style={({ pressed }) => [
            styles.newBtn,
            { borderColor: palette.ink },
            pressed && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="add" size={18} color={palette.ink} />
          <AppText variant="small" tone="ink">新しい旅</AppText>
        </Pressable>
      </Row>

      <Gap h={space.xl} />

      {ongoing.length > 0 && (
        <>
          <AppText variant="eyebrow" tone="inkFaint">いま、旅の途中</AppText>
          <Gap h={space.md} />
          {ongoing.map((t) => (
            <FeaturedTrip key={t.id} trip={t} palette={palette} />
          ))}
          <Gap h={space.xl} />
          <AppText variant="eyebrow" tone="inkFaint">これまでの旅</AppText>
          <Gap h={space.sm} />
        </>
      )}

      <Rule />
      {rest.map((t) => (
        <View key={t.id}>
          <TripRow trip={t} palette={palette} />
          <Rule />
        </View>
      ))}
    </Screen>
  );
}

function FeaturedTrip({ trip, palette }: { trip: Trip; palette: any }) {
  return (
    <Pressable
      onPress={() => router.push(`/trip/${trip.id}`)}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
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
          <MiniStat value={String(trip.stepCount)} label="ステップ" color={palette.paper} />
          <MiniStat value={String(trip.goshuinCount)} label="御朱印" color={palette.paper} />
          <MiniStat value={`${trip.distanceKm}km`} label="移動" color={palette.paper} />
        </Row>
      </View>
    </Pressable>
  );
}

function TripRow({ trip, palette }: { trip: Trip; palette: any }) {
  return (
    <Pressable
      onPress={() => router.push(`/trip/${trip.id}`)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="small" tone="inkFaint">
          {trip.startDate.replace(/-/g, '.')} — {trip.prefectures.join('・')}
        </AppText>
        <Gap h={2} />
        <AppText variant="h3" tone="ink">{trip.title}</AppText>
        <Gap h={space.xs} />
        <Row style={{ gap: space.md }}>
          <Meta icon="footsteps-outline" text={`${trip.stepCount}`} palette={palette} />
          <Meta icon="ribbon-outline" text={`${trip.goshuinCount}`} palette={palette} />
          <Meta icon="people-outline" text={`${trip.members.length}`} palette={palette} />
        </Row>
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
    </Pressable>
  );
}

function MiniStat({ value, label, color }: any) {
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
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: hairline * 2,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: 2,
  },
  hero: { padding: space.lg, borderRadius: 3 },
  pulse: { width: 7, height: 7, borderRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.lg, gap: space.md },
});
