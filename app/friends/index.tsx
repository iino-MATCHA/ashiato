import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Button } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { friends, allTrips } from '@/lib/mock';

export default function FriendsList() {
  const { palette } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header
        title="Friends"
        right={
          <Pressable onPress={() => router.push('/friends/add')} hitSlop={8}>
            <Ionicons name="person-add-outline" size={20} color={palette.matcha} />
          </Pressable>
        }
      />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        <Gap h={space.md} />
        <Rule />
        {friends.map((f) => {
          const tripCount = allTrips.filter((t) => t.authorId === f.id).length;
          return (
            <View key={f.id}>
              <Pressable onPress={() => router.push(`/friends/${f.id}`)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
                <View style={[styles.avatar, { backgroundColor: f.color }]}>
                  <AppText variant="bodyStrong" style={{ color: '#fff' }}>{f.name.slice(0, 1)}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" tone="ink">{f.name}</AppText>
                  <AppText variant="small" tone="inkFaint">@{f.username} · {tripCount} trips</AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
              </Pressable>
              <Rule />
            </View>
          );
        })}

        <Gap h={space.xl} />
        <Button label="Add friends" tone="matcha" onPress={() => router.push('/friends/add')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
