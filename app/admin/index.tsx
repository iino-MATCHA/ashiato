/**
 * /admin — まず日本全体を見るページ。
 * ここで全国の傾向（訪問の多い県・季節性・滞在日数・インバウンド比・移動手段）を
 * 掴んでから、Prefectures タブで個別の県に降りていく。
 */
import { useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { AdminShell, Panel, TableRow, Tiles } from '@/components/admin/AdminShell';
import { BarList, MonthBars, StackedBar, formatNumber } from '@/components/admin/Charts';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useAdmin } from '@/lib/useAdmin';
import { PREFECTURE_EN_BY_ID } from '@/lib/prefectures';

const SEGMENT_LABEL: Record<string, string> = { inbound: 'Inbound', domestic: 'Domestic', unknown: 'Not stated' };
const TRANSPORT_LABEL: Record<string, string> = {
  walk: 'Walk', bicycle: 'Bicycle', car: 'Car', bus: 'Bus', train: 'Train',
  shinkansen: 'Shinkansen', ferry: 'Ferry', plane: 'Plane', other: 'Other',
};

export default function AdminJapan() {
  const { palette } = useTheme();
  const { role, stats, analytics, notifications, markRead } = useAdmin();
  const unread = notifications.filter((n) => !n.readAt);

  const byPref = analytics?.prefecture?.by_prefecture ?? [];
  const overall = analytics?.stay?.overall ?? null;
  const inbound = analytics?.stay?.inbound_vs_domestic ?? [];

  const intensity = useMemo(() => {
    const top = Math.max(1, ...byPref.map((r: any) => Number(r.visits)));
    const out: Record<number, number> = {};
    byPref.forEach((r: any) => { out[Number(r.code)] = Number(r.visits) / top; });
    return out;
  }, [byPref]);

  const monthTotals = useMemo(() => {
    const arr = Array(12).fill(0);
    (analytics?.prefecture?.by_month ?? []).forEach((r: any) => { arr[Number(r.month) - 1] += Number(r.visits); });
    return arr;
  }, [analytics]);

  const coverage = byPref.length;

  return (
    <AdminShell title="Japan overview" role={role}>
      {/* 決済が完了するとここに積まれる。数字ではなく件名を出して、
          何が売れたのかを開かずに掴めるようにする。 */}
      {notifications.length > 0 && (
        <>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Eyebrow tone={unread.length ? 'shu' : 'matcha'}>
              {unread.length ? `New orders (${unread.length})` : 'Orders'}
            </Eyebrow>
            {unread.length > 0 && (
              <Pressable onPress={() => markRead()} hitSlop={8}>
                <AppText variant="small" tone="inkFaint">Mark all read</AppText>
              </Pressable>
            )}
          </Row>
          <Gap h={space.md} />
          <Panel>
            {notifications.slice(0, 6).map((n, i) => (
              <View key={n.id}>
                {i > 0 && <Rule />}
                <Pressable
                  onPress={() => markRead(n.id)}
                  style={{ paddingVertical: space.sm, opacity: n.readAt ? 0.55 : 1 }}
                >
                  <Row style={{ gap: space.sm, alignItems: 'flex-start' }}>
                    <Ionicons
                      name={n.readAt ? 'ellipse-outline' : 'ellipse'}
                      size={9}
                      color={n.readAt ? palette.inkFaint : palette.shu}
                      style={{ marginTop: 6 }}
                    />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyStrong" tone="ink">{n.title}</AppText>
                      {!!n.body && <AppText variant="small" tone="inkSoft">{n.body}</AppText>}
                      <AppText variant="small" tone="inkFaint" style={{ fontSize: 11 }}>
                        {n.createdAt.slice(0, 16).replace('T', ' ')}
                      </AppText>
                    </View>
                  </Row>
                </Pressable>
              </View>
            ))}
          </Panel>
          <Gap h={space.xl} />
        </>
      )}

      <Eyebrow tone="matcha">Platform</Eyebrow>
      <Gap h={space.md} />
      <Tiles
        items={[
          ['Users', stats?.users ?? 0],
          ['Trips', stats?.trips ?? 0],
          ['Check-ins', stats?.stops ?? 0],
          ['Prefectures reached', `${coverage} / 47`],
        ]}
      />

      {/* 日本全体の訪問分布 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">Visits across Japan</Eyebrow>
      <Gap h={space.sm} />
      <AppText variant="small" tone="inkFaint">The darker the prefecture, the more check-ins it has. Tap a row to open its page.</AppText>
      <Gap h={space.md} />
      <Panel>
        <Row style={{ justifyContent: 'center' }}>
          <JapanSvgMap visited={[]} intensity={intensity} width={300} />
        </Row>
        <Gap h={space.md} />
        <BarList
          items={byPref.map((r: any) => ({
            key: String(r.code),
            label: PREFECTURE_EN_BY_ID[Number(r.code)] ?? `#${r.code}`,
            value: Number(r.visits),
            note: `${r.travellers} travellers`,
          }))}
          limit={10}
          onPress={(item) => router.push(`/admin/prefecture/${item.key}` as any)}
          emptyText="No check-ins recorded yet."
        />
        {byPref.length > 10 && (
          <><Gap h={space.md} />
            <AppText variant="small" tone="matcha" onPress={() => router.replace('/admin/prefectures' as any)}>
              See all {byPref.length} prefectures →
            </AppText></>
        )}
      </Panel>

      {/* 季節性 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">When they travel</Eyebrow>
      <Gap h={space.md} />
      <Panel title="Check-ins per month" hint="All prefectures combined.">
        <MonthBars values={monthTotals} />
      </Panel>

      {/* 全国平均 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">Nationwide averages</Eyebrow>
      <Gap h={space.md} />
      <Tiles
        items={[
          ['Avg trip length', overall ? `${formatNumber(Number(overall.avg_trip_days))} d` : '–'],
          ['Avg cities per trip', overall ? formatNumber(Number(overall.avg_cities)) : '–'],
          ['Trips analysed', overall ? String(overall.trips) : '–'],
        ]}
      />
      <Gap h={space.md} />
      <Panel title="By nationality">
        <TableRow cells={['Nationality', 'Trips', 'Avg days', 'Avg cities']} header wide={0} />
        {(analytics?.stay?.by_nationality ?? []).map((r: any) => (
          <TableRow
            key={r.nationality}
            wide={0}
            cells={[String(r.nationality).toUpperCase(), String(r.trips), formatNumber(Number(r.avg_days)), formatNumber(Number(r.avg_cities))]}
          />
        ))}
      </Panel>

      {/* インバウンド比 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">Inbound vs domestic</Eyebrow>
      <Gap h={space.md} />
      <Panel>
        <StackedBar
          parts={inbound.map((r: any) => ({
            key: r.segment,
            label: SEGMENT_LABEL[r.segment] ?? r.segment,
            value: Number(r.trips),
            color: r.segment === 'inbound' ? palette.shu : r.segment === 'domestic' ? palette.matcha : palette.ruleStrong,
          }))}
        />
        <Gap h={space.md} />
        <TableRow cells={['Segment', 'Travellers', 'Trips', 'Avg days']} header wide={0} />
        {inbound.map((r: any) => (
          <TableRow
            key={r.segment}
            wide={0}
            cells={[SEGMENT_LABEL[r.segment] ?? r.segment, String(r.travellers), String(r.trips), formatNumber(Number(r.avg_days))]}
          />
        ))}
      </Panel>

      {/* 年代・移動手段 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">Who they are</Eyebrow>
      <Gap h={space.md} />
      <Panel title="Age bands">
        <BarList
          items={(analytics?.stay?.by_age_band ?? []).map((r: any) => ({ key: r.band, label: r.band, value: Number(r.users) }))}
          emptyText="No dates of birth on file yet."
        />
      </Panel>
      <Gap h={space.md} />
      <Panel title="How they travel">
        <BarList
          items={(analytics?.transport ?? []).map((r: any) => ({
            key: r.mode,
            label: TRANSPORT_LABEL[r.mode] ?? r.mode,
            value: Number(r.moves),
            note: `${formatNumber(Number(r.avg_km))} km avg`,
          }))}
          emptyText="No legs recorded yet."
        />
      </Panel>

      {/* 回遊 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">Common moves between prefectures</Eyebrow>
      <Gap h={space.md} />
      <Panel>
        <TableRow cells={['#', 'From → To', 'Moves']} header />
        {(analytics?.prefecture?.transitions ?? []).slice(0, 10).map((t: any, i: number) => (
          <TableRow
            key={`${t.from_code}-${t.to_code}`}
            cells={[
              String(i + 1),
              `${PREFECTURE_EN_BY_ID[Number(t.from_code)] ?? t.from_code} → ${PREFECTURE_EN_BY_ID[Number(t.to_code)] ?? t.to_code}`,
              String(t.moves),
            ]}
          />
        ))}
      </Panel>
      <View style={{ height: space.xl }} />
    </AdminShell>
  );
}
