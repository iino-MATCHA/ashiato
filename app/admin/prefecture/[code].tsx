/**
 * /admin/prefecture/[code] — 1つの都道府県だけを掘るページ。
 * 全国ページで見つけた県について、誰が・いつ来て・どこに泊まり・どこから来て
 * どこへ抜けたのかをまとめる。集計は既に取得済みの分析データから切り出す。
 *
 * 移動手段はここに置く。全国でまとめても「電車が多い」以上のことは分からず、
 * 「この県には何で入ってくるのか」で初めて打ち手になるため（全国の集計は外した）。
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppText, Row, Gap, Eyebrow } from '@/components/ui';
import { AdminShell, Panel, TableRow, Tiles } from '@/components/admin/AdminShell';
import { BarList, MonthBars, StackedBar, formatNumber } from '@/components/admin/Charts';
import { SpotHeatmap } from '@/components/admin/SpotHeatmap';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useAdmin } from '@/lib/useAdmin';
import { PREFECTURE_JA_BY_ID } from '@/lib/prefectures';

/** transports.mode（0001のenum）の日本語。bicycle は古い呼び名の保険 */
const TRANSPORT_LABEL: Record<string, string> = {
  walk: '徒歩', bike: '自転車', bicycle: '自転車', car: '車', bus: 'バス',
  train: '電車', shinkansen: '新幹線', ferry: '船', plane: '飛行機', other: 'その他',
};

export default function AdminPrefecture() {
  const { code: raw } = useLocalSearchParams<{ code: string }>();
  const code = Number(raw);
  const { palette } = useTheme();
  const { role, analytics } = useAdmin();

  const name = PREFECTURE_JA_BY_ID[code] ?? `#${code}`;

  const summary = useMemo(
    () => (analytics?.prefecture?.by_prefecture ?? []).find((r: any) => Number(r.code) === code),
    [analytics, code]
  );
  const stay = useMemo(
    () => (analytics?.stay?.stay_by_prefecture ?? []).find((r: any) => Number(r.code) === code),
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

  /**
   * この県の移動手段。0032 の admin_transport_by_prefecture から。
   * 到着した立ち寄り先の県で数えている（その移動でこの県に入った、と読む）。
   */
  const transport = useMemo(
    () => (analytics?.transportByPrefecture ?? []).filter((r: any) => Number(r.code) === code),
    [analytics, code]
  );

  /**
   * インバウンドと国内の2つだけ。全国ページと同じ寄せ方で、未記入は国内に数える。
   * by_origin（0032）が無い環境では、by_prefecture の人数から組み立てる。
   */
  const origin = useMemo(() => {
    const rows = (analytics?.prefecture?.by_origin ?? []).filter((r: any) => Number(r.code) === code);
    let inbound = 0;
    let domestic = 0;
    if (rows.length) {
      rows.forEach((r: any) => {
        if (r.segment === 'inbound') inbound += Number(r.travellers) || 0;
        else domestic += Number(r.travellers) || 0;
      });
    } else if (summary) {
      inbound = Number(summary.inbound_travellers ?? 0);
      domestic = Number(summary.domestic_travellers ?? Math.max(0, Number(summary.travellers ?? 0) - inbound));
    }
    return [
      { key: 'inbound', label: 'インバウンド', travellers: inbound },
      { key: 'domestic', label: '国内', travellers: domestic },
    ];
  }, [analytics, code, summary]);

  const spots = municipalities.map((m: any) => ({
    code: m.code, name: m.name ?? String(m.code),
    lat: Number(m.lat), lng: Number(m.lng), visits: Number(m.visits),
  }));

  return (
    <AdminShell title={name} role={role} back>
      <Row style={{ justifyContent: 'center' }}>
        {/* この県だけを塗って位置を示す */}
        <JapanSvgMap visited={[]} intensity={{ [code]: 1 }} width={220} />
      </Row>

      <Gap h={space.md} />
      <Tiles
        items={[
          ['チェックイン', summary?.visits ?? 0],
          ['訪れた人', summary?.travellers ?? 0],
          ['うちインバウンド', summary?.inbound_travellers ?? 0],
          ['平均滞在', stay ? `${formatNumber(Number(stay.avg_days))}日` : '–'],
        ]}
      />

      {/* いつ来ているか */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">いつ来ているか</Eyebrow>
      <Gap h={space.md} />
      <Panel title="月ごとのチェックイン">
        <MonthBars values={months} />
      </Panel>

      {/* 誰が来ているか。国や都市ごとの内訳は出さず、2つに絞る */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">誰が来ているか</Eyebrow>
      <Gap h={space.sm} />
      <AppText variant="small" tone="inkFaint">日本の外から来た人と、国内の人の2つで見る。未記入の人は国内に数える。</AppText>
      <Gap h={space.md} />
      <Panel>
        <StackedBar
          parts={origin.map((r) => ({
            key: r.key,
            label: r.label,
            value: r.travellers,
            color: r.key === 'inbound' ? palette.shu : palette.matcha,
          }))}
        />
        <Gap h={space.md} />
        <TableRow cells={['区分', '人数']} header wide={0} />
        {origin.map((r) => (
          <TableRow key={r.key} wide={0} cells={[r.label, String(r.travellers)]} />
        ))}
      </Panel>

      {/* 何で移動しているか（全国のまとめはやめて、県ごとに置いた） */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">何で移動しているか</Eyebrow>
      <Gap h={space.sm} />
      <AppText variant="small" tone="inkFaint">{name}へ入ってきた区間の移動手段。</AppText>
      <Gap h={space.md} />
      <Panel>
        <BarList
          items={transport.map((r: any) => ({
            key: String(r.mode),
            label: TRANSPORT_LABEL[r.mode] ?? r.mode,
            value: Number(r.moves),
            note: `平均${formatNumber(Number(r.avg_km))}km`,
          }))}
          emptyText="移動の記録がまだありません。"
        />
      </Panel>

      {/* 県内のどこ */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">{name}のどこへ</Eyebrow>
      <Gap h={space.md} />
      <Panel title="市区町村ごとのチェックイン">
        <BarList
          items={municipalities.map((m: any) => ({
            key: String(m.code), label: m.name ?? String(m.code), value: Number(m.visits),
          }))}
          limit={15}
          emptyText="チェックインはまだありません。"
        />
      </Panel>
      {spots.length > 0 && (
        <><Gap h={space.md} />
          <SpotHeatmap points={spots} height={300} /></>
      )}

      {/* 回遊 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">前後に寄った県</Eyebrow>
      <Gap h={space.md} />
      <Panel title="ここへ来る前">
        <TableRow cells={['都道府県', '回数']} header wide={0} />
        {arrivedFrom.slice(0, 8).map((t: any) => (
          <TableRow key={`in-${t.from_code}`} wide={0} cells={[PREFECTURE_JA_BY_ID[Number(t.from_code)] ?? `#${t.from_code}`, String(t.moves)]} />
        ))}
        {arrivedFrom.length === 0 && <AppText variant="small" tone="inkFaint">記録がありません。</AppText>}
      </Panel>
      <Gap h={space.md} />
      <Panel title="ここから次に">
        <TableRow cells={['都道府県', '回数']} header wide={0} />
        {wentOnTo.slice(0, 8).map((t: any) => (
          <TableRow key={`out-${t.to_code}`} wide={0} cells={[PREFECTURE_JA_BY_ID[Number(t.to_code)] ?? `#${t.to_code}`, String(t.moves)]} />
        ))}
        {wentOnTo.length === 0 && <AppText variant="small" tone="inkFaint">記録がありません。</AppText>}
      </Panel>
      <View style={{ height: space.xl }} />
    </AdminShell>
  );
}
