import { useCallback, useRef, useState } from 'react';
import { View, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchFriends, fetchFriendRequests, respondFriendRequest, removeFriend, type UserSummary, type FriendRequest } from '@/lib/api';
import { friends as mockFriends } from '@/lib/mock';

export default function FriendsList() {
  const { palette } = useTheme();
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) {
      setFriends(mockFriends.map((f) => ({ id: f.id, name: f.name, username: f.username, avatarUrl: '' })));
      setLoading(false);
      return;
    }
    Promise.all([fetchFriends(), fetchFriendRequests()])
      .then(([f, r]) => { if (alive.current) { setFriends(f); setRequests(r); } })
      .catch(() => {})
      .finally(() => alive.current && setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));

  const respond = async (id: string, accept: boolean) => {
    setRequests((cur) => cur.filter((r) => r.id !== id)); // optimistic
    await respondFriendRequest(id, accept);
    load();
  };
  const remove = async (id: string) => {
    setFriends((cur) => cur.filter((f) => f.id !== id)); // optimistic
    await removeFriend(id);
  };

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
        {loading ? (
          <><Gap h={space.xxl} /><ActivityIndicator color={palette.matcha} style={{ alignSelf: 'center' }} /></>
        ) : (
          <>
            {/* incoming friend requests — the "someone added you" notifications */}
            {requests.length > 0 && (
              <>
                <Gap h={space.lg} />
                <Eyebrow tone="shu">Friend requests · {requests.length}</Eyebrow>
                <Gap h={space.sm} />
                {requests.map((r) => (
                  <View key={r.id} style={[styles.requestCard, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
                    <Avatar user={r.from} palette={palette} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyStrong" tone="ink">{r.from.name}</AppText>
                      <AppText variant="small" tone="inkFaint">@{r.from.username} wants to be friends</AppText>
                    </View>
                    <Pressable onPress={() => respond(r.id, true)} style={[styles.acceptBtn, { backgroundColor: palette.matcha }]}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </Pressable>
                    <Pressable onPress={() => respond(r.id, false)} style={[styles.declineBtn, { borderColor: palette.ruleStrong }]}>
                      <Ionicons name="close" size={18} color={palette.inkSoft} />
                    </Pressable>
                  </View>
                ))}
              </>
            )}

            <Gap h={space.lg} />
            <Eyebrow>Your friends · {friends.length}</Eyebrow>
            <Gap h={space.sm} />
            <Rule />
            {friends.map((f) => (
              <View key={f.id}>
                <Row style={styles.row}>
                  <Pressable onPress={() => router.push(`/friends/${f.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, flex: 1 }}>
                    <Avatar user={f} palette={palette} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyStrong" tone="ink">{f.name}</AppText>
                      <AppText variant="small" tone="inkFaint">@{f.username}</AppText>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => remove(f.id)} hitSlop={8} style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1, padding: 6 }]}>
                    <Ionicons name="person-remove-outline" size={18} color={palette.shu} />
                  </Pressable>
                </Row>
                <Rule />
              </View>
            ))}
            {friends.length === 0 && (
              <><Gap h={space.md} /><AppText variant="small" tone="inkFaint">No friends yet — add someone below.</AppText></>
            )}

            <Gap h={space.xl} />
            <Button label="Add friends" tone="matcha" onPress={() => router.push('/friends/add')} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function Avatar({ user, palette }: { user: UserSummary; palette: any }) {
  return (
    <View style={[styles.avatar, { backgroundColor: palette.fill }]}>
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
      ) : (
        <Ionicons name="person" size={20} color={palette.matcha} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  requestCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: hairline, borderRadius: 12, padding: space.md, marginBottom: space.sm },
  acceptBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  declineBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: hairline * 2, alignItems: 'center', justifyContent: 'center' },
});
