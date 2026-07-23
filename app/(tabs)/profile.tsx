import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { trips, acquiredCount } from '@/lib/mock';

const settings = [
  { icon: 'battery-half-outline', label: 'Battery & power saving', note: 'Balance tracking accuracy and battery' },
  { icon: 'receipt-outline', label: 'Order history', note: 'Photo books & gifts' },
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'lock-closed-outline', label: 'Privacy & visibility' },
  { icon: 'help-circle-outline', label: 'Help & contact' },
] as const;

export default function Profile() {
  const { palette } = useTheme();
  const totalDistance = trips.reduce((s, t) => s + t.distanceKm, 0);
  const totalStops = trips.reduce((s, t) => s + t.steps.length, 0);

  return (
    <Screen>
      <Gap h={space.md} />
      <Row style={{ gap: space.md, alignItems: 'center' }}>
        <View style={[styles.avatar, { backgroundColor: palette.ai }]}>
          <AppText variant="h1" style={{ color: palette.paper }}>T</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="h2" tone="ink">Taro Yamada</AppText>
          <AppText variant="small" tone="inkFaint">@taro</AppText>
        </View>
        <Pressable style={({ pressed }) => [styles.edit, { borderColor: palette.ruleStrong }, pressed && { opacity: 0.6 }]}>
          <AppText variant="small" tone="inkSoft">Edit</AppText>
        </Pressable>
      </Row>

      <Gap h={space.xl} />
      <Eyebrow>Travel stats</Eyebrow>
      <Gap h={space.md} />
      <Row style={{ alignItems: 'stretch' }}>
        <Stat value={String(trips.length)} label="Trips" palette={palette} />
        <Rule vertical />
        <Stat value={String(totalStops)} label="Stops" palette={palette} />
        <Rule vertical />
        <Stat value={String(acquiredCount)} label="Goshuin" palette={palette} />
      </Row>
      <Gap h={space.lg} />
      <Row style={[styles.distance, { borderColor: palette.rule }]}>
        <View>
          <AppText variant="eyebrow" tone="inkFaint">Total distance</AppText>
          <Gap h={2} />
          <Row style={{ alignItems: 'flex-end', gap: 4 }}>
            <AppText variant="display" tone="shu" style={{ lineHeight: 44 }}>{totalDistance.toLocaleString()}</AppText>
            <AppText variant="h3" tone="inkFaint" style={{ marginBottom: 6 }}>km</AppText>
          </Row>
        </View>
        <Ionicons name="trail-sign-outline" size={40} color={palette.rule} />
      </Row>

      <Gap h={space.xl} />
      <Eyebrow tone="ai">Settings</Eyebrow>
      <Gap h={space.md} />
      <Rule />
      {settings.map((s) => (
        <View key={s.label}>
          <Pressable style={({ pressed }) => [styles.setting, pressed && { opacity: 0.6 }]}>
            <Ionicons name={s.icon as any} size={20} color={palette.inkSoft} />
            <View style={{ flex: 1 }}>
              <AppText variant="body" tone="ink">{s.label}</AppText>
              {'note' in s && s.note && <AppText variant="small" tone="inkFaint">{s.note}</AppText>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
          </Pressable>
          <Rule />
        </View>
      ))}

      <Gap h={space.xl} />
      <Pressable onPress={() => router.replace('/(auth)/login')} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
        <AppText variant="body" tone="inkFaint" center>Log out</AppText>
      </Pressable>
    </Screen>
  );
}

function Stat({ value, label, palette }: any) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: space.sm }}>
      <AppText variant="h1" tone="ink">{value}</AppText>
      <AppText variant="eyebrow" tone="inkFaint">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  edit: { borderWidth: hairline * 2, paddingHorizontal: space.md, paddingVertical: 6, borderRadius: 2 },
  distance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: hairline, borderRadius: 3, padding: space.lg },
  setting: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
});
