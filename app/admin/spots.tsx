/**
 * /admin/spots — 市区町村レベルのマッピング。
 * ヒートマップで面として見て、下の表で順位を確認する。
 */
import { useMemo, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Gap, Eyebrow } from '@/components/ui';
import { AdminShell, Panel } from '@/components/admin/AdminShell';
import { BarList } from '@/components/admin/Charts';
import { SpotHeatmap } from '@/components/admin/SpotHeatmap';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useAdmin } from '@/lib/useAdmin';
import { PREFECTURE_JA_BY_ID } from '@/lib/prefectures';

export default function AdminSpots() {
  const { palette } = useTheme();
  const { role, analytics } = useAdmin();
  const [q, setQ] = useState('');

  const all = useMemo(
    () => (analytics?.municipality?.by_municipality ?? []).map((m: any) => ({
      code: m.code,
      name: m.name ?? String(m.code),
      pref: Number(m.pref),
      prefName: PREFECTURE_JA_BY_ID[Number(m.pref)] ?? `#${m.pref}`,
      lat: Number(m.lat), lng: Number(m.lng), visits: Number(m.visits),
    })),
    [analytics]
  );

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter((m: any) => m.name.toLowerCase().includes(term) || m.prefName.toLowerCase().includes(term));
  }, [all, q]);

  return (
    <AdminShell title="市区町村のようす" role={role}>
      <Row style={[styles.search, { borderColor: palette.ruleStrong }]}>
        <Ionicons name="search" size={18} color={palette.inkFaint} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="市区町村名や県名で絞る"
          placeholderTextColor={palette.inkFaint}
          style={[styles.searchInput, { color: palette.ink }]}
          autoCapitalize="none"
        />
        {!!q && (
          <Pressable onPress={() => setQ('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={palette.inkFaint} />
          </Pressable>
        )}
      </Row>

      <Gap h={space.lg} />
      <Eyebrow tone="matcha">ヒートマップ</Eyebrow>
      <Gap h={space.sm} />
      <AppText variant="small" tone="inkFaint">チェックインを地図に置いたもの。拡大すると市区町村ごとに見える。</AppText>
      <Gap h={space.md} />
      <SpotHeatmap points={rows} height={440} />

      <Gap h={space.xl} />
      <Eyebrow tone="matcha">チェックインの多い市区町村</Eyebrow>
      <Gap h={space.md} />
      <Panel>
        <BarList
          items={rows.map((m: any) => ({ key: String(m.code), label: m.name, value: m.visits, note: m.prefName }))}
          limit={30}
          emptyText="この条件に当たるチェックインはありません。"
        />
      </Panel>
      <View style={{ height: space.xl }} />
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', gap: space.sm, borderBottomWidth: hairline * 2, paddingBottom: space.sm },
  searchInput: { flex: 1, fontFamily: fonts.gothicRegular, fontSize: type.body, paddingVertical: 4 },
});
