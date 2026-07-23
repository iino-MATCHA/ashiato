import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Screen, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useProfile } from '@/lib/useProfile';
import { trips, acquiredCount, friends } from '@/lib/mock';

const settings = [
  { icon: 'battery-half-outline', label: 'Battery & power saving' },
  { icon: 'receipt-outline', label: 'Order history' },
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'lock-closed-outline', label: 'Privacy & visibility' },
  { icon: 'help-circle-outline', label: 'Help & contact' },
] as const;

export default function ProfilePage() {
  const { palette } = useTheme();
  const { profile, signOut } = useProfile();
  const totalStops = trips.reduce((s, t) => s + t.steps.length, 0);
  const totalKm = trips.reduce((s, t) => s + t.distanceKm, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top']}>
      <Header
        title="Profile"
        right={
          <Pressable onPress={() => router.push('/profile/edit')} hitSlop={8}>
            <AppText variant="bodyStrong" tone="matcha">Edit</AppText>
          </Pressable>
        }
      />
      <Screen edges={[]}>
        <Gap h={space.sm} />
        <Row style={{ gap: space.md, alignItems: 'center' }}>
          <View style={[styles.avatar, { backgroundColor: palette.matcha }]}>
            <AppText variant="h1" style={{ color: '#fff' }}>{profile.name.slice(0, 1)}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="h2" tone="ink">{profile.name}</AppText>
            <AppText variant="small" tone="inkFaint">@{profile.username}</AppText>
            {!!profile.bio && <AppText variant="small" tone="inkSoft">{profile.bio}</AppText>}
          </View>
        </Row>

        <Gap h={space.xl} />
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
              <AppText variant="display" tone="matcha" style={{ lineHeight: 44 }}>{totalKm.toLocaleString()}</AppText>
              <AppText variant="h3" tone="inkFaint" style={{ marginBottom: 6 }}>km</AppText>
            </Row>
          </View>
          <Ionicons name="trail-sign-outline" size={40} color={palette.rule} />
        </Row>

        {/* Friends */}
        <Gap h={space.xl} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>Friends · {friends.length}</Eyebrow>
          <Pressable onPress={() => router.push('/friends')}>
            <AppText variant="small" tone="matcha">See all →</AppText>
          </Pressable>
        </Row>
        <Gap h={space.md} />
        <Row style={{ gap: space.md, alignItems: 'center' }}>
          {friends.map((f) => (
            <Pressable key={f.id} onPress={() => router.push(`/friends/${f.id}`)} style={{ alignItems: 'center', width: 56 }}>
              <View style={[styles.friendAvatar, { backgroundColor: f.color }]}>
                <AppText variant="bodyStrong" style={{ color: '#fff' }}>{f.name.slice(0, 1)}</AppText>
              </View>
              <Gap h={4} />
              <AppText variant="small" tone="inkSoft" numberOfLines={1}>{f.name}</AppText>
            </Pressable>
          ))}
          <Pressable onPress={() => router.push('/friends/add')} style={{ alignItems: 'center', width: 56 }}>
            <View style={[styles.friendAdd, { borderColor: palette.ruleStrong }]}>
              <Ionicons name="person-add-outline" size={18} color={palette.inkSoft} />
            </View>
            <Gap h={4} />
            <AppText variant="small" tone="inkFaint">Add</AppText>
          </Pressable>
        </Row>

        {/* Settings */}
        <Gap h={space.xl} />
        <Eyebrow tone="ai">Settings</Eyebrow>
        <Gap h={space.md} />
        <Rule />
        {settings.map((s) => (
          <View key={s.label}>
            <Pressable style={({ pressed }) => [styles.setting, pressed && { opacity: 0.6 }]}>
              <Ionicons name={s.icon as any} size={20} color={palette.inkSoft} />
              <AppText variant="body" tone="ink" style={{ flex: 1 }}>{s.label}</AppText>
              <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
            </Pressable>
            <Rule />
          </View>
        ))}

        <Gap h={space.xl} />
        <Pressable onPress={() => { signOut(); router.replace('/(auth)/login'); }} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
          <AppText variant="body" tone="inkFaint" center>Log out</AppText>
        </Pressable>
      </Screen>
    </SafeAreaView>
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
  avatar: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  distance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: hairline, borderRadius: 3, padding: space.lg },
  friendAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  friendAdd: { width: 44, height: 44, borderRadius: 22, borderWidth: hairline * 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  setting: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
});
