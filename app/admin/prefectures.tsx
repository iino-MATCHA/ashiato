/**
 * /admin/prefectures — 都道府県を軸に見るページ。
 * 「東京」と検索すればその県だけに絞れる。行をタップすると詳細ページへ。
 */
import { useMemo, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { AdminShell, Panel } from '@/components/admin/AdminShell';
import { BarList, formatNumber } from '@/components/admin/Charts';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useAdmin } from '@/lib/useAdmin';
import { PREFECTURE_EN_BY_ID, PREFECTURE_JA_BY_ID } from '@/lib/prefectures';

export default function AdminPrefectures() {
  const { palette } = useTheme();
  const { role, analytics } = useAdmin();
  const [q, setQ] = useState('');

  const stayByCode = useMemo(() => {
    const m: Record<number, { avg: number; trips: number }> = {};
    (analytics?.stay?.stay_by_prefecture ?? []).forEach((r: any) => {
      m[Number(r.code)] = { avg: Number(r.avg_days), trips: Number(r.trips) };
    });
    return m;
  }, [analytics]);

  /** 47都道府県すべてを並べる（データがない県も 0 として出す）。 */
  const rows = useMemo(() => {
    const visits: Record<number, { visits: number; travellers: number; inbound: number }> = {};
    (analytics?.prefecture?.by_prefecture ?? []).forEach((r: any) => {
      visits[Number(r.code)] = {
        visits: Number(r.visits),
        travellers: Number(r.travellers),
        inbound: Number(r.inbound_travellers ?? 0),
      };
    });
    const all = Array.from({ length: 47 }, (_, i) => i + 1).map((code) => ({
      code,
      en: PREFECTURE_EN_BY_ID[code] ?? `#${code}`,
      ja: PREFECTURE_JA_BY_ID[code] ?? '',
      ...(visits[code] ?? { visits: 0, travellers: 0, inbound: 0 }),
      stay: stayByCode[code]?.avg ?? 0,
    }));
    const term = q.trim().toLowerCase();
    const filtered = term
      ? all.filter((r) => r.en.toLowerCase().includes(term) || r.ja.includes(q.trim()) || String(r.code) === term)
      : all;
    return filtered.sort((a, b) => b.visits - a.visits || a.code - b.code);
  }, [analytics, q, stayByCode]);

  const searching = q.trim().length > 0;

  return (
    <AdminShell title="都道府県" role={role}>
      <Row style={[styles.search, { borderColor: palette.ruleStrong }]}>
        <Ionicons name="search" size={18} color={palette.inkFaint} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="県名で絞る（東京都 / Tokyo / 13）"
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
      <Eyebrow tone="matcha">{searching ? `${rows.length}件` : '47都道府県'}</Eyebrow>
      <Gap h={space.sm} />
      <AppText variant="small" tone="inkFaint">チェックインの多い順。行を押すとその県のページへ。</AppText>
      <Gap h={space.md} />

      <View style={[styles.card, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
        {rows.map((r, i) => (
          <View key={r.code}>
            <Pressable
              onPress={() => router.push(`/admin/prefecture/${r.code}` as any)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
            >
              <AppText variant="small" tone="inkFaint" style={{ width: 24 }}>{i + 1}</AppText>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" tone="ink">{r.ja || r.en}</AppText>
                <AppText variant="small" tone="inkFaint">
                  チェックイン{r.visits} · {r.travellers}人{r.stay ? ` · 平均${formatNumber(r.stay)}日` : ''}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={palette.inkFaint} />
            </Pressable>
            <Rule />
          </View>
        ))}
        {rows.length === 0 && (
          <View style={{ padding: space.lg }}>
            <AppText variant="small" tone="inkFaint">「{q.trim()}」に当たる県はありません。</AppText>
          </View>
        )}
      </View>

      {!searching && (
        <>
          <Gap h={space.xl} />
          <Eyebrow tone="matcha">滞在が長い県</Eyebrow>
          <Gap h={space.md} />
          <Panel>
            <BarList
              items={(analytics?.stay?.stay_by_prefecture ?? []).map((r: any) => ({
                key: `s${r.code}`,
                label: PREFECTURE_JA_BY_ID[Number(r.code)] ?? `#${r.code}`,
                value: Number(r.avg_days),
                note: `${r.trips}件の旅`,
              }))}
              unit="日"
              limit={12}
              onPress={(it) => router.push(`/admin/prefecture/${it.key.slice(1)}` as any)}
              emptyText="滞在の記録がまだありません。"
            />
          </Panel>
        </>
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', gap: space.sm, borderBottomWidth: hairline * 2, paddingBottom: space.sm },
  searchInput: { flex: 1, fontFamily: fonts.gothicRegular, fontSize: type.body, paddingVertical: 4 },
  card: { borderWidth: hairline, borderRadius: 10, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.md },
});
