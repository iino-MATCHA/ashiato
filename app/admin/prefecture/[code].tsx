/**
 * /admin/prefecture/[code] — 1つの都道府県だけを掘るページ。
 * 全国ページで見つけた県について、誰が・いつ来て・どこに泊まり・どこから来て
 * どこへ抜けたのかをまとめる。集計は既に取得済みの分析データから切り出す。
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppText, Row, Gap, Eyebrow } from '@/components/ui';
import { AdminShell, Panel, TableRow, Tiles } from '@/components/admin/AdminShell';
import { BarList, MonthBars, formatNumber } from '@/components/admin/Charts';
import { SpotHeatmap } from '@/components/admin/SpotHeatmap';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { space } from '@/lib/theme';
import { useAdmin } from '@/lib/useAdmin';
import { PREFECTURE_EN_BY_ID, PREFECTURE_KANJI_BY_ID } from '@/lib/prefectures';

export default function AdminPrefecture() {
  const { code: raw } = useLocalSearchParams<{ code: string }>();
  const code = Number(raw);
  const { role, analytics } = useAdmin();

  const en = PREFECTURE_EN_BY_ID[code] ?? `#${code}`;
  const kanji = PREFECTURE_KANJI_BY_ID[code] ?? '';

  const summary = useMemo(
    () => (analytics?.prefecture?.by_prefecture ?? []).find((r: any) => Number(r.code) === code),
    [analytics, code]
  );
  const stay = useMemo(
    () => (analytics?.stay?.stay_by_prefecture ?? []).find((r: any) => Number(r.code) === code),
    [analytics, code]
  );
  const nationalities = useMemo(
    () => (analytics?.prefecture?.by_nationality ?? []).filter((r: any) => Number(r.code) === code),
    [analytics, code]
  );
  const months = useMemo(() => {
    const arr = Array(12).fill(0);
    (analytics?.prefecture?.by_month ?? [])
      .filter((r: any) => Number(r.code) === code)
      .forEach((r: any) => { arr[Number(r.month) - 1] = Number(r.visits); });
    return arr;
  }, [analytics, code]);
  const municipalities = useMemo(
    () => (analytics?.municipality?.by_municipality ?? []).filter((m: any) => Number(m.pref) === code),
    [analytics, code]
  );
  const arrivedFrom = useMemo(
    () => (analytics?.prefecture?.transitions ?? []).filter((t: any) => Number(t.to_code) === code),
    [analytics, code]
  );
  const wentOnTo = useMemo(
    () => (analytics?.prefecture?.transitions ?? []).filter((t: any) => Number(t.from_code) === code),
    [analytics, code]
  );

  const spots = municipalities.map((m: any) => ({
    code: m.code, name: m.name ?? String(m.code),
    lat: Number(m.lat), lng: Number(m.lng), visits: Number(m.visits),
  }));

  return (
    <AdminShell title={`${en}${kanji ? ` / ${kanji}` : ''}`} role={role} back>
      <Row style={{ justifyContent: 'center' }}>
        {/* この県だけを塗って位置を示す */}
        <JapanSvgMap visited={[]} intensity={{ [code]: 1 }} width={220} />
      </Row>

      <Gap h={space.md} />
      <Tiles
        items={[
          ['Check-ins', summary?.visits ?? 0],
          ['Travellers', summary?.travellers ?? 0],
          ['Inbound travellers', summary?.inbound_travellers ?? 0],
          ['Avg stay', stay ? `${formatNumber(Number(stay.avg_days))} d` : '–'],
        ]}
      />

      {/* いつ来ているか */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">Seasonality</Eyebrow>
      <Gap h={space.md} />
      <Panel title="Check-ins per month">
        <MonthBars values={months} />
      </Panel>

      {/* どこの国から */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">Who visits</Eyebrow>
      <Gap h={space.md} />
      <Panel title="By nationality">
        <BarList
          items={nationalities.map((r: any) => ({
            key: r.nationality, label: String(r.nationality).toUpperCase(), value: Number(r.visits),
          }))}
          emptyText="No nationality on file for these check-ins."
        />
      </Panel>

      {/* 県内のどこ */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">Inside {en}</Eyebrow>
      <Gap h={space.md} />
      <Panel title="Municipalities by check-ins">
        <BarList
          items={municipalities.map((m: any) => ({
            key: String(m.code), label: m.name ?? String(m.code), value: Number(m.visits),
          }))}
          limit={15}
          emptyText="No check-ins recorded yet."
        />
      </Panel>
      {spots.length > 0 && (
        <><Gap h={space.md} />
          <SpotHeatmap points={spots} height={300} /></>
      )}

      {/* 回遊 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">Before and after</Eyebrow>
      <Gap h={space.md} />
      <Panel title={`Arrived from`}>
        <TableRow cells={['Prefecture', 'Moves']} header wide={0} />
        {arrivedFrom.slice(0, 8).map((t: any) => (
          <TableRow key={`in-${t.from_code}`} wide={0} cells={[PREFECTURE_EN_BY_ID[Number(t.from_code)] ?? `#${t.from_code}`, String(t.moves)]} />
        ))}
        {arrivedFrom.length === 0 && <AppText variant="small" tone="inkFaint">No inbound legs recorded.</AppText>}
      </Panel>
      <Gap h={space.md} />
      <Panel title={`Went on to`}>
        <TableRow cells={['Prefecture', 'Moves']} header wide={0} />
        {wentOnTo.slice(0, 8).map((t: any) => (
          <TableRow key={`out-${t.to_code}`} wide={0} cells={[PREFECTURE_EN_BY_ID[Number(t.to_code)] ?? `#${t.to_code}`, String(t.moves)]} />
        ))}
        {wentOnTo.length === 0 && <AppText variant="small" tone="inkFaint">No outbound legs recorded.</AppText>}
      </Panel>
      <View style={{ height: space.xl }} />
    </AdminShell>
  );
}
