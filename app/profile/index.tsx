import { View, Pressable, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Screen, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useProfile } from '@/lib/useProfile';
import { useTrips, useVisitedPrefectures } from '@/lib/useData';
import { RankModal, rankFor } from '@/components/RankModal';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchUnreadCount, fetchFriends, fetchFriendRequests, fetchMyAdminRole, type UserSummary } from '@/lib/api';
import { friends as mockFriends } from '@/lib/mock';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { CountUp } from '@/components/CountUp';
import { shareInvite } from '@/lib/invite';

export default function ProfilePage() {
  const { palette } = useTheme();
  const { profile, signOut } = useProfile();
  // プロフィールは本人のものしか無い。ゲストはログインへ返す
  const { signedIn } = useSession();
  const { t } = useI18n();
  const { trips } = useTrips();
  const { codes: visited } = useVisitedPrefectures();
  const [rankOpen, setRankOpen] = useState(false);
  // 共有シートが無い環境では文面がクリップボードへ入る。通知は出さない
  const invite = () => { shareInvite(); };
  const [unread, setUnread] = useState(0);
  const [friends, setFriends] = useState<UserSummary[]>(
    isSupabaseConfigured ? [] : mockFriends.map((f) => ({ id: f.id, name: f.name, username: f.username, avatarUrl: '' }))
  );
  const [pendingReq, setPendingReq] = useState(0);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const aliveRef = useRef(true);
  useFocusEffect(useCallback(() => {
    aliveRef.current = true;
    if (isSupabaseConfigured) {
      fetchUnreadCount().then((n) => aliveRef.current && setUnread(n));
      fetchFriends().then((f) => aliveRef.current && setFriends(f)).catch(() => {});
      fetchFriendRequests().then((r) => aliveRef.current && setPendingReq(r.length)).catch(() => {});
      fetchMyAdminRole().then((r) => aliveRef.current && setAdminRole(r)).catch(() => {});
    }
    return () => { aliveRef.current = false; };
  }, []));
  // real data only — exclude the sample/showcase trip from stats
  const myTrips = trips.filter((t) => !t.sample);
  const totalStops = myTrips.reduce((s, t) => s + t.steps.length, 0);
  const totalKm = myTrips.reduce((s, t) => s + t.distanceKm, 0);

  if (signedIn === false) return <Redirect href="/(auth)/login" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top']}>
      <Header
        title={t('profile.header')}
        right={
          <Pressable onPress={() => router.push('/profile/edit')} hitSlop={8}>
            <AppText variant="bodyStrong" tone="matcha">{t('common.edit')}</AppText>
          </Pressable>
        }
      />
      <Screen edges={[]}>
        <Gap h={space.sm} />
        <Row style={{ gap: space.md, alignItems: 'center' }}>
          <View style={[styles.avatar, { backgroundColor: palette.fill, borderColor: palette.matcha }]}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
            ) : (
              <Ionicons name="person" size={30} color={palette.matcha} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="h2" tone="ink">{profile.name}</AppText>
            <AppText variant="small" tone="inkFaint">@{profile.username}</AppText>
            <Gap h={6} />
            <Pressable onPress={() => setRankOpen(true)} style={[styles.rankPill, { borderColor: palette.matcha }]}>
              <Ionicons name="ribbon-outline" size={13} color={palette.matcha} />
              <AppText variant="small" tone="matcha">{rankFor(visited.length)}</AppText>
            </Pressable>
          </View>
        </Row>
        <RankModal visible={rankOpen} onClose={() => setRankOpen(false)} count={visited.length} />

        <Gap h={space.xl} />
        <Row style={{ alignItems: 'stretch' }}>
          <Stat value={myTrips.length} label={t('profile.trips')} palette={palette} />
          <Rule vertical />
          <Stat value={totalStops} label={t('profile.stops')} palette={palette} />
          <Rule vertical />
          <Stat value={visited.length} label={t('profile.goshuin')} palette={palette} />
        </Row>
        <Gap h={space.lg} />
        <Row style={[styles.distance, { borderColor: palette.rule }]}>
          <View>
            <AppText variant="eyebrow" tone="inkFaint">{t('profile.totalDistance')}</AppText>
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
          <Row style={{ gap: 8, alignItems: 'center' }}>
            <Eyebrow>{t('profile.friends')} · {friends.length}</Eyebrow>
            {pendingReq > 0 && (
              <View style={[styles.badge, { backgroundColor: palette.shu }]}>
                <AppText variant="small" style={{ color: '#fff' }}>{pendingReq}</AppText>
              </View>
            )}
          </Row>
          <Pressable onPress={() => router.push('/friends')}>
            <AppText variant="small" tone="matcha">{t('common.seeAll')} →</AppText>
          </Pressable>
        </Row>
        <Gap h={space.sm} />
        {/* 招待カードを送る。小さく、囲まない */}
        <Pressable onPress={invite} hitSlop={8}>
          <Row style={{ gap: 5, alignItems: 'center' }}>
            <Ionicons name="paper-plane-outline" size={13} color={palette.matcha} />
            <AppText variant="small" tone="matcha" style={{ fontSize: 12 }}>{t('buddy.invite')}</AppText>
          </Row>
        </Pressable>
        <Gap h={space.md} />
        <Row style={{ gap: space.md, alignItems: 'center' }}>
          {friends.slice(0, 5).map((f) => (
            <Pressable key={f.id} onPress={() => router.push(`/friends/${f.id}`)} style={{ alignItems: 'center', width: 56 }}>
              <View style={[styles.friendAvatar, { backgroundColor: palette.fill }]}>
                {f.avatarUrl ? (
                  <Image source={{ uri: f.avatarUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
                ) : (
                  <Ionicons name="person" size={20} color={palette.matcha} />
                )}
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
            <AppText variant="small" tone="inkFaint">{t('common.add')}</AppText>
          </Pressable>
        </Row>

        {/* Settings */}
        <Gap h={space.xl} />
        <Eyebrow tone="ai">{t('settings.title')}</Eyebrow>
        <Gap h={space.md} />
        <Rule />
        {[
          { icon: 'notifications-outline', label: t('settings.notifications'), onPress: () => router.push('/notifications'), badge: unread },
          { icon: 'map-outline', label: t('settings.editPrefectures'), onPress: () => router.push('/(auth)/prefectures?edit=1') },
          { icon: 'share-social-outline', label: t('settings.shareCard'), onPress: () => router.push('/goshuin/share') },
          { icon: 'receipt-outline', label: t('settings.orders'), onPress: () => router.push('/orders' as any) },
          { icon: 'key-outline', label: t('password.title'), onPress: () => router.push('/profile/password' as any) },
          { icon: 'lock-closed-outline', label: t('settings.privacy'), onPress: () => router.push('/privacy') },
          ...(adminRole ? [{ icon: 'shield-checkmark-outline', label: t('settings.admin'), onPress: () => router.push('/admin') }] : []),
        ].map((s: any) => (
          <View key={s.label}>
            <Pressable onPress={s.onPress} style={({ pressed }) => [styles.setting, pressed && { opacity: 0.6 }]}>
              <Ionicons name={s.icon as any} size={20} color={palette.inkSoft} />
              <AppText variant="body" tone="ink" style={{ flex: 1 }}>{s.label}</AppText>
              {!!s.badge && (
                <View style={[styles.badge, { backgroundColor: palette.shu }]}>
                  <AppText variant="small" style={{ color: '#fff' }}>{s.badge}</AppText>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
            </Pressable>
            <Rule />
          </View>
        ))}

        <Gap h={space.xl} />
        <Pressable onPress={() => { signOut(); router.replace('/(auth)/login'); }} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
          <AppText variant="body" tone="inkFaint" center>{t('common.logout')}</AppText>
        </Pressable>
      </Screen>
    </SafeAreaView>
  );
}

function Stat({ value, label, palette }: any) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: space.sm }}>
      {/* 実績の数字は0から回す */}
      <CountUp value={Number(value) || 0} variant="h1" tone="ink" />
      <AppText variant="eyebrow" tone="inkFaint">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  rankPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, borderWidth: StyleSheet.hairlineWidth * 2, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  distance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: hairline, borderRadius: 3, padding: space.lg },
  friendAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  friendAdd: { width: 44, height: 44, borderRadius: 22, borderWidth: hairline * 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  setting: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
});
