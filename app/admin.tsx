import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Pressable, TextInput, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchMyAdminRole, fetchAdminStats, fetchAdminOrders, fetchAdmins, setAdminRole, fetchAnalytics } from '@/lib/api';
import { PREFECTURE_EN_BY_ID } from '@/lib/prefectures';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { BarList, MonthBars, Segmented, StackedBar, formatNumber, type BarItem } from '@/components/admin/Charts';
import { SpotHeatmap } from '@/components/admin/SpotHeatmap';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SEGMENT_LABEL: Record<string, string> = { inbound: 'Inbound', domestic: 'Domestic', unknown: 'Not stated' };
const TRANSPORT_LABEL: Record<string, string> = {
  walk: 'Walk', bicycle: 'Bicycle', car: 'Car', bus: 'Bus', train: 'Train',
  shinkansen: 'Shinkansen', ferry: 'Ferry', plane: 'Plane', other: 'Other',
};

/** 運営用コンソール（Web想定・/admin）。管理者のみ閲覧可。 */
export default function AdminConsole() {
  const { palette } = useTheme();
  const [role, setRole] = useState<string | null | 'loading'>('loading');
  const [stats, setStats] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[] | null>(null);
  const [admins, setAdmins] = useState<{ username: string; name: string; role: string }[]>([]);
  const [grantName, setGrantName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [an, setAn] = useState<Awaited<ReturnType<typeof fetchAnalytics>> | null>(null);
  const [prefAxis, setPrefAxis] = useState<'all' | 'nationality' | 'month'>('all');
  const [nat, setNat] = useState<string>('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setRole(null); return; }
    fetchMyAdminRole().then(async (r) => {
      if (!alive.current) return;
      setRole(r);
      if (r) {
        const [s, o, a, an2] = await Promise.all([fetchAdminStats(), fetchAdminOrders(), fetchAdmins(), fetchAnalytics()]);
        if (!alive.current) return;
        setStats(s);
        setOrders(o);
        setAdmins(a);
        setAn(an2);
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

  // ---- 分析データの整形（都道府県を主軸に、国籍／月で切り替えられるようにする）
  const prefName = (code: number | string) => PREFECTURE_EN_BY_ID[Number(code)] ?? `#${code}`;

  const nationalities = useMemo(() => {
    const set = new Set<string>();
    (an?.prefecture?.by_nationality ?? []).forEach((r: any) => set.add(r.nationality));
    return Array.from(set);
  }, [an]);

  /** 選んだ軸に応じた都道府県ランキング。 */
  const prefRows: BarItem[] = useMemo(() => {
    if (!an?.prefecture) return [];
    if (prefAxis === 'nationality') {
      const key = nat || nationalities[0] || '';
      return (an.prefecture.by_nationality ?? [])
        .filter((r: any) => r.nationality === key)
        .map((r: any) => ({ key: `n${r.code}`, label: prefName(r.code), value: Number(r.visits) }));
    }
    if (prefAxis === 'month') {
      return (an.prefecture.by_month ?? [])
        .filter((r: any) => Number(r.month) === month)
        .map((r: any) => ({ key: `m${r.code}`, label: prefName(r.code), value: Number(r.visits) }));
    }
    return (an.prefecture.by_prefecture ?? []).map((r: any) => ({
      key: `p${r.code}`,
      label: prefName(r.code),
      value: Number(r.visits),
      note: `${r.travellers} travellers`,
    }));
  }, [an, prefAxis, nat, month, nationalities]);

  /** 上のランキングをそのまま日本地図に落とす（濃さ＝訪問数）。 */
  const prefIntensity = useMemo(() => {
    const src =
      prefAxis === 'nationality'
        ? (an?.prefecture?.by_nationality ?? []).filter((r: any) => r.nationality === (nat || nationalities[0]))
        : prefAxis === 'month'
        ? (an?.prefecture?.by_month ?? []).filter((r: any) => Number(r.month) === month)
        : an?.prefecture?.by_prefecture ?? [];
    const top = Math.max(1, ...src.map((r: any) => Number(r.visits)));
    const out: Record<number, number> = {};
    src.forEach((r: any) => { out[Number(r.code)] = Number(r.visits) / top; });
    return out;
  }, [an, prefAxis, nat, month, nationalities]);

  const monthTotals = useMemo(() => {
    const arr = Array(12).fill(0);
    (an?.prefecture?.by_month ?? []).forEach((r: any) => { arr[Number(r.month) - 1] += Number(r.visits); });
    return arr;
  }, [an]);

  const spots = useMemo(
    () => (an?.municipality?.by_municipality ?? []).map((m: any) => ({
      code: m.code, name: m.name ?? String(m.code), pref: m.pref,
      lat: Number(m.lat), lng: Number(m.lng), visits: Number(m.visits),
    })),
    [an]
  );

  const inbound = an?.stay?.inbound_vs_domestic ?? [];
  const overall = an?.stay?.overall ?? null;

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

        {/* ① 都道府県別（国籍・月で軸を切替） */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Where travellers go</Eyebrow>
        <Gap h={space.sm} />
        <AppText variant="small" tone="inkFaint">Visits per prefecture. Switch the axis to slice by nationality or by month.</AppText>
        <Gap h={space.md} />
        <Segmented
          value={prefAxis}
          onChange={(k) => setPrefAxis(k as any)}
          options={[{ key: 'all', label: 'All travellers' }, { key: 'nationality', label: 'By nationality' }, { key: 'month', label: 'By month' }]}
        />
        {prefAxis === 'nationality' && nationalities.length > 0 && (
          <><Gap h={space.sm} />
            <Segmented
              value={nat || nationalities[0]}
              onChange={setNat}
              options={nationalities.map((n) => ({ key: n, label: n.toUpperCase() }))}
            /></>
        )}
        {prefAxis === 'month' && (
          <><Gap h={space.sm} />
            <Segmented
              value={String(month)}
              onChange={(k) => setMonth(Number(k))}
              options={MONTHS.map((m, i) => ({ key: String(i + 1), label: m }))}
            />
            <Gap h={space.md} />
            <View style={[styles.panel, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
              <AppText variant="eyebrow" tone="inkFaint">Visits across the year</AppText>
              <Gap h={space.sm} />
              <MonthBars values={monthTotals} />
            </View></>
        )}
        <Gap h={space.md} />
        <View style={[styles.panel, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
          <Row style={{ justifyContent: 'center' }}>
            <JapanSvgMap visited={[]} intensity={prefIntensity} width={300} />
          </Row>
          <Gap h={space.md} />
          <BarList items={prefRows} limit={15} emptyText="No check-ins recorded yet." />
        </View>

        {/* ① 回遊: 前後に訪問した都道府県 */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Common prefecture-to-prefecture moves</Eyebrow>
        <Gap h={space.md} />
        <View style={[styles.tableCard, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
          <TableRow cells={['#', 'From → To', 'Moves']} header palette={palette} />
          {(an?.prefecture?.transitions ?? []).slice(0, 12).map((t: any, i: number) => (
            <TableRow
              key={`${t.from_code}-${t.to_code}`}
              cells={[String(i + 1), `${prefName(t.from_code)} → ${prefName(t.to_code)}`, String(t.moves)]}
              palette={palette}
            />
          ))}
        </View>

        {/* ② 市区町村別 */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Most visited municipalities</Eyebrow>
        <Gap h={space.md} />
        <View style={[styles.panel, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
          <BarList
            items={spots.map((s: any) => ({ key: String(s.code), label: s.name, value: s.visits, note: s.pref ? prefName(s.pref) : undefined }))}
            limit={15}
            emptyText="No check-ins recorded yet."
          />
        </View>

        {/* ⑦ スポットのヒートマップ */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Spot heatmap</Eyebrow>
        <Gap h={space.md} />
        <SpotHeatmap points={spots} />

        {/* ③ 都道府県ごとの平均滞在日数 */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Average stay per prefecture</Eyebrow>
        <Gap h={space.md} />
        <View style={[styles.panel, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
          <BarList
            items={(an?.stay?.stay_by_prefecture ?? []).map((r: any) => ({
              key: `s${r.code}`, label: prefName(r.code), value: Number(r.avg_days), note: `${r.trips} trips`,
            }))}
            unit="d"
            limit={15}
            emptyText="No stays recorded yet."
          />
        </View>

        {/* ④ 全国平均＋国籍別 */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Nationwide averages</Eyebrow>
        <Gap h={space.md} />
        <View style={styles.tileGrid}>
          {[
            ['Avg trip length', overall ? `${formatNumber(Number(overall.avg_trip_days))} d` : '–'],
            ['Avg cities per trip', overall ? formatNumber(Number(overall.avg_cities)) : '–'],
            ['Trips analysed', overall ? String(overall.trips) : '–'],
          ].map(([label, value]) => (
            <View key={label} style={[styles.tile, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
              <AppText variant="h2" tone="ink">{value}</AppText>
              <AppText variant="eyebrow" tone="inkFaint">{label}</AppText>
            </View>
          ))}
        </View>
        <Gap h={space.md} />
        <View style={[styles.tableCard, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
          <TableRow cells={['Nationality', 'Trips', 'Avg days', 'Avg cities']} header palette={palette} />
          {(an?.stay?.by_nationality ?? []).map((r: any) => (
            <TableRow
              key={r.nationality}
              cells={[String(r.nationality).toUpperCase(), String(r.trips), formatNumber(Number(r.avg_days)), formatNumber(Number(r.avg_cities))]}
              palette={palette}
            />
          ))}
        </View>

        {/* ⑤ インバウンド VS 国内 */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Inbound vs domestic</Eyebrow>
        <Gap h={space.md} />
        <View style={[styles.panel, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
          <StackedBar
            parts={inbound.map((r: any) => ({
              key: r.segment,
              label: SEGMENT_LABEL[r.segment] ?? r.segment,
              value: Number(r.trips),
              color: r.segment === 'inbound' ? palette.shu : r.segment === 'domestic' ? palette.matcha : palette.ruleStrong,
            }))}
          />
          <Gap h={space.md} />
          <TableRow cells={['Segment', 'Travellers', 'Trips', 'Avg days']} header palette={palette} />
          {inbound.map((r: any) => (
            <TableRow
              key={r.segment}
              cells={[SEGMENT_LABEL[r.segment] ?? r.segment, String(r.travellers), String(r.trips), formatNumber(Number(r.avg_days))]}
              palette={palette}
            />
          ))}
        </View>

        {/* 年代 */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Age bands</Eyebrow>
        <Gap h={space.md} />
        <View style={[styles.panel, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
          <BarList
            items={(an?.stay?.by_age_band ?? []).map((r: any) => ({ key: r.band, label: r.band, value: Number(r.users) }))}
            emptyText="No dates of birth on file yet."
          />
        </View>

        {/* ⑥ 移動手段 */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">How they travel</Eyebrow>
        <Gap h={space.md} />
        <View style={[styles.panel, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
          <BarList
            items={(an?.transport ?? []).map((r: any) => ({
              key: r.mode, label: TRANSPORT_LABEL[r.mode] ?? r.mode, value: Number(r.moves), note: `${formatNumber(Number(r.avg_km))} km avg`,
            }))}
            emptyText="No legs recorded yet."
          />
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
  panel: { borderWidth: hairline, borderRadius: 10, padding: space.md },
  tr: { paddingVertical: 10, paddingHorizontal: 6, borderBottomWidth: hairline, borderBottomColor: 'rgba(0,0,0,0.05)' },
  adminRow: { gap: space.sm, alignItems: 'center', paddingVertical: 10, paddingHorizontal: space.md, borderBottomWidth: hairline, borderBottomColor: 'rgba(0,0,0,0.05)' },
  grantBar: { position: 'relative', height: 44, borderWidth: hairline * 2, borderRadius: 22, justifyContent: 'center' },
  grantInput: { fontFamily: fonts.gothicRegular, fontSize: type.small, paddingLeft: space.md, paddingRight: 76, minWidth: 0 },
  grantBtn: { position: 'absolute', right: 5, top: 5, height: 34, paddingHorizontal: 14, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
