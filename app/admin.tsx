import { useCallback, useRef, useState } from 'react';
import { View, Pressable, TextInput, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchMyAdminRole, fetchAdminStats, fetchAdminOrders, fetchAdmins, setAdminRole } from '@/lib/api';
import { PREFECTURE_EN_BY_ID } from '@/lib/prefectures';

/** 運営用コンソール（Web想定・/admin）。管理者のみ閲覧可。 */
export default function AdminConsole() {
  const { palette } = useTheme();
  const [role, setRole] = useState<string | null | 'loading'>('loading');
  const [stats, setStats] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[] | null>(null);
  const [admins, setAdmins] = useState<{ username: string; name: string; role: string }[]>([]);
  const [grantName, setGrantName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setRole(null); return; }
    fetchMyAdminRole().then(async (r) => {
      if (!alive.current) return;
      setRole(r);
      if (r) {
        const [s, o, a] = await Promise.all([fetchAdminStats(), fetchAdminOrders(), fetchAdmins()]);
        if (!alive.current) return;
        setStats(s);
        setOrders(o);
        setAdmins(a);
      }
    });
  }, []);
  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));

  const grant = async () => {
    const name = grantName.trim().replace(/^@/, '');
    if (!name) return;
    setMsg(null);
    const ok = await setAdminRole(name, 'moderator');
    setMsg(ok ? `@${name} is now a moderator.` : `Could not find @${name}.`);
    setGrantName('');
    load();
  };
  const revoke = async (username: string) => {
    await setAdminRole(username, null);
    load();
  };

  if (role === 'loading') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.matcha} />
      </SafeAreaView>
    );
  }
  if (!role) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
        <Header title="Admin" />
        <Rule />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
          <Ionicons name="lock-closed-outline" size={40} color={palette.inkFaint} />
          <Gap h={space.sm} />
          <AppText variant="h3" tone="ink">Admins only</AppText>
          <AppText variant="small" tone="inkFaint" center>Sign in with an administrator account to open this console.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const tiles = stats ? [
    ['Users', stats.users], ['Trips', stats.trips], ['Public trips', stats.public_trips],
    ['Stops', stats.stops], ['Photos', stats.photos], ['Comments', stats.comments],
    ['Likes', stats.likes], ['Friendships', stats.friendships],
  ] : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title="Admin console" />
      <Rule />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl, maxWidth: 720, alignSelf: 'center', width: '100%' }} showsVerticalScrollIndicator={false}>

        {/* KPI */}
        <Gap h={space.md} />
        <Eyebrow tone="matcha">Overview</Eyebrow>
        <Gap h={space.md} />
        <View style={styles.tileGrid}>
          {tiles.map(([label, value]) => (
            <View key={String(label)} style={[styles.tile, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
              <AppText variant="h2" tone="ink">{String(value ?? 0)}</AppText>
              <AppText variant="eyebrow" tone="inkFaint">{String(label)}</AppText>
            </View>
          ))}
        </View>

        {/* 製本管理 */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Photo book orders</Eyebrow>
        <Gap h={space.md} />
        {(orders ?? []).length === 0 ? (
          <View style={[styles.empty, { borderColor: palette.rule }]}>
            <Ionicons name="book-outline" size={22} color={palette.inkFaint} />
            <AppText variant="small" tone="inkFaint">No orders yet. They will appear here once photo-book checkout launches.</AppText>
          </View>
        ) : (
          <View style={[styles.tableCard, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
            <TableRow cells={['Ordered', 'Buyer', 'Book', 'Status', '¥']} header palette={palette} />
            {(orders ?? []).map((o: any) => (
              <TableRow key={o.id} cells={[o.ordered, `@${o.buyer ?? '-'}`, o.book_title ?? '-', o.status, String(o.amount_jpy ?? 0)]} palette={palette} />
            ))}
          </View>
        )}

        {/* 管理者管理 */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Administrators</Eyebrow>
        <Gap h={space.md} />
        <View style={[styles.tableCard, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
          {admins.map((a) => (
            <Row key={a.username} style={styles.adminRow}>
              <Ionicons name="shield-checkmark" size={16} color={palette.matcha} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" tone="ink">{a.name}</AppText>
                <AppText variant="small" tone="inkFaint">@{a.username} · {a.role}</AppText>
              </View>
              {a.role !== 'superadmin' && (
                <Pressable onPress={() => revoke(a.username)} hitSlop={8}>
                  <AppText variant="small" tone="shu">Remove</AppText>
                </Pressable>
              )}
            </Row>
          ))}
        </View>
        <Gap h={space.sm} />
        <View style={[styles.grantBar, { borderColor: palette.ruleStrong }]}>
          <TextInput
            value={grantName}
            onChangeText={setGrantName}
            placeholder="username to grant moderator"
            placeholderTextColor={palette.inkFaint}
            autoCapitalize="none"
            style={[styles.grantInput, { color: palette.ink }]}
            onSubmitEditing={grant}
          />
          <Pressable onPress={grant} style={[styles.grantBtn, { backgroundColor: grantName.trim() ? palette.matcha : palette.fill }]}>
            <AppText variant="small" style={{ color: grantName.trim() ? '#fff' : palette.inkFaint }}>Grant</AppText>
          </Pressable>
        </View>
        {!!msg && (<><Gap h={space.sm} /><AppText variant="small" tone="inkSoft">{msg}</AppText></>)}

        {/* 旅行者データ */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Most visited prefectures</Eyebrow>
        <Gap h={space.md} />
        <View style={[styles.tableCard, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
          <TableRow cells={['#', 'Prefecture', 'Stops']} header palette={palette} />
          {(stats?.top_prefectures ?? []).map((t: any, i: number) => (
            <TableRow key={t.code} cells={[String(i + 1), PREFECTURE_EN_BY_ID[t.code] ?? String(t.code), String(t.visits)]} palette={palette} />
          ))}
        </View>

        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Recent signups</Eyebrow>
        <Gap h={space.md} />
        <View style={[styles.tableCard, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
          <TableRow cells={['Joined', 'Name', 'Username']} header palette={palette} />
          {(stats?.recent_users ?? []).map((u: any) => (
            <TableRow key={u.username} cells={[u.joined, u.display_name ?? '-', `@${u.username}`]} palette={palette} />
          ))}
        </View>

        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Recent trips</Eyebrow>
        <Gap h={space.md} />
        <View style={[styles.tableCard, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
          <TableRow cells={['Created', 'Title', 'Owner', 'Visibility']} header palette={palette} />
          {(stats?.recent_trips ?? []).map((t: any, i: number) => (
            <TableRow key={`${t.title}-${i}`} cells={[t.created, t.title, `@${t.owner ?? '-'}`, t.visibility]} palette={palette} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TableRow({ cells, header, palette }: { cells: string[]; header?: boolean; palette: any }) {
  return (
    <Row style={[styles.tr, header && { backgroundColor: palette.fill }]}>
      {cells.map((c, i) => (
        <AppText
          key={i}
          variant={header ? 'eyebrow' : 'small'}
          tone={header ? 'inkFaint' : 'ink'}
          numberOfLines={1}
          style={{ flex: i === 1 ? 2 : 1, paddingHorizontal: 8 }}
        >
          {c}
        </AppText>
      ))}
    </Row>
  );
}

const styles = StyleSheet.create({
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: { width: '23%', minWidth: 130, flexGrow: 1, borderWidth: hairline, borderRadius: 10, padding: space.md, alignItems: 'center' },
  empty: { borderWidth: hairline, borderStyle: 'dashed', borderRadius: 10, padding: space.lg, alignItems: 'center', gap: 6 },
  tableCard: { borderWidth: hairline, borderRadius: 10, overflow: 'hidden' },
  tr: { paddingVertical: 10, paddingHorizontal: 6, borderBottomWidth: hairline, borderBottomColor: 'rgba(0,0,0,0.05)' },
  adminRow: { gap: space.sm, alignItems: 'center', paddingVertical: 10, paddingHorizontal: space.md, borderBottomWidth: hairline, borderBottomColor: 'rgba(0,0,0,0.05)' },
  grantBar: { position: 'relative', height: 44, borderWidth: hairline * 2, borderRadius: 22, justifyContent: 'center' },
  grantInput: { fontFamily: fonts.gothicRegular, fontSize: type.small, paddingLeft: space.md, paddingRight: 76, minWidth: 0 },
  grantBtn: { position: 'absolute', right: 5, top: 5, height: 34, paddingHorizontal: 14, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
