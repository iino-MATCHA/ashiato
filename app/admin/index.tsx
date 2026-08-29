/**
 * /admin — まず日本全体を見るページ。
 * ここで全国の傾向（訪問の多い県・季節性・滞在日数・インバウンド比）を
 * 掴んでから、都道府県タブで個別の県に降りていく。
 *
 * 移動手段は全国のまとめを置かない。全国で見ても「電車が多い」以上のことは
 * 分からないので、県ごとのページ（/admin/prefecture/[code]）に移した。
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
import { PREFECTURE_JA_BY_ID } from '@/lib/prefectures';

const AGE_LABEL: Record<string, string> = {
  '<20': '20歳未満', '20s': '20代', '30s': '30代', '40s': '40代',
  '50s': '50代', '60+': '60歳以上', unknown: '未記入',
};

export default function AdminJapan() {
  const { palette } = useTheme();
  const { role, stats, analytics } = useAdmin();

  const byPref = analytics?.prefecture?.by_prefecture ?? [];
  const overall = analytics?.stay?.overall ?? null;

  /**
   * インバウンドと国内の2つだけにする。
   * 出身は profiles.residence（'inbound' / 'domestic'）から取る。
   * 未記入の人は国内に数える ―― 3本目の「不明」を作らないため
   * （DB側も 0032 の origin_segment で同じ寄せ方をしている。
   *   まだ貼っていない環境では 'unknown' が返るので、ここでも畳む）。
   */
  const origin = useMemo(() => {
    const rows = analytics?.stay?.inbound_vs_domestic ?? [];
    const base: Record<'inbound' | 'domestic', { travellers: number; trips: number; days: number }> = {
      inbound: { travellers: 0, trips: 0, days: 0 },
      domestic: { travellers: 0, trips: 0, days: 0 },
    };
    rows.forEach((r: any) => {
      const key = r.segment === 'inbound' ? 'inbound' : 'domestic';
      const trips = Number(r.trips) || 0;
      base[key].travellers += Number(r.travellers) || 0;
      base[key].days += (Number(r.avg_days) || 0) * trips;   // 平均を足し直せるよう旅数で重みづけ
      base[key].trips += trips;
    });
    return (['inbound', 'domestic'] as const).map((key) => ({
      key,
      label: key === 'inbound' ? 'インバウンド' : '国内',
      travellers: base[key].travellers,
      trips: base[key].trips,
      avgDays: base[key].trips ? base[key].days / base[key].trips : 0,
    }));
  }, [analytics]);

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
    <AdminShell title="全国のようす" role={role}>
      <Eyebrow tone="matcha">全体</Eyebrow>
      <Gap h={space.md} />
      <Tiles
        items={[
          ['利用者', stats?.users ?? 0],
          ['旅', stats?.trips ?? 0],
          ['チェックイン', stats?.stops ?? 0],
          ['訪問された県', `${coverage} / 47`],
        ]}
      />

      {/* 日本全体の訪問分布 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">どこへ行っているか</Eyebrow>
      <Gap h={space.sm} />
      <AppText variant="small" tone="inkFaint">色が濃い県ほどチェックインが多い。行を押すとその県のページへ。</AppText>
      <Gap h={space.md} />
      <Panel>
        <Row style={{ justifyContent: 'center' }}>
          <JapanSvgMap visited={[]} intensity={intensity} width={300} />
        </Row>
        <Gap h={space.md} />
        <BarList
          items={byPref.map((r: any) => ({
            key: String(r.code),
            label: PREFECTURE_JA_BY_ID[Number(r.code)] ?? `#${r.code}`,
            value: Number(r.visits),
            note: `${r.travellers}人`,
          }))}
          limit={10}
          onPress={(item) => router.push(`/admin/prefecture/${item.key}` as any)}
          emptyText="チェックインはまだありません。"
        />
        {byPref.length > 10 && (
          <><Gap h={space.md} />
            <AppText variant="small" tone="matcha" onPress={() => router.replace('/admin/prefectures' as any)}>
              {byPref.length}県すべてを見る →
            </AppText></>
        )}
      </Panel>

      {/* 季節性 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">いつ行っているか</Eyebrow>
      <Gap h={space.md} />
      <Panel title="月ごとのチェックイン" hint="全都道府県の合計。">
        <MonthBars values={monthTotals} />
      </Panel>

      {/* 全国平均 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">全国の平均</Eyebrow>
      <Gap h={space.md} />
      <Tiles
        items={[
          ['旅の日数', overall ? `${formatNumber(Number(overall.avg_trip_days))}日` : '–'],
          ['1回の旅で回る市区町村', overall ? formatNumber(Number(overall.avg_cities)) : '–'],
          ['集計した旅', overall ? String(overall.trips) : '–'],
        ]}
      />

      {/* インバウンドと国内。国や都市ごとの内訳は置かない ―― 見たいのは
          「外から来た人か、国内の人か」の2つだけ、という判断（オーナー） */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">インバウンドと国内</Eyebrow>
      <Gap h={space.sm} />
      <AppText variant="small" tone="inkFaint">日本の外から来た人と、国内の人の2つで見る。未記入の人は国内に数える。</AppText>
      <Gap h={space.md} />
      <Panel>
        <StackedBar
          parts={origin.map((r) => ({
            key: r.key,
            label: r.label,
            value: r.trips,
            color: r.key === 'inbound' ? palette.shu : palette.matcha,
          }))}
        />
        <Gap h={space.md} />
        <TableRow cells={['区分', '人数', '旅の数', '平均日数']} header wide={0} />
        {origin.map((r) => (
          <TableRow
            key={r.key}
            wide={0}
            cells={[r.label, String(r.travellers), String(r.trips), `${formatNumber(r.avgDays)}日`]}
          />
        ))}
      </Panel>

      {/* 年代 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">どんな人か</Eyebrow>
      <Gap h={space.md} />
      <Panel title="年代">
        <BarList
          items={(analytics?.stay?.by_age_band ?? []).map((r: any) => ({
            key: r.band, label: AGE_LABEL[r.band] ?? r.band, value: Number(r.users),
          }))}
          emptyText="生年月日の登録がまだありません。"
        />
      </Panel>

      {/* 回遊 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">県から県への移動</Eyebrow>
      <Gap h={space.md} />
      <Panel>
        <TableRow cells={['#', 'どこから → どこへ', '回数']} header />
        {(analytics?.prefecture?.transitions ?? []).slice(0, 10).map((t: any, i: number) => (
          <TableRow
            key={`${t.from_code}-${t.to_code}`}
            cells={[
              String(i + 1),
              `${PREFECTURE_JA_BY_ID[Number(t.from_code)] ?? t.from_code} → ${PREFECTURE_JA_BY_ID[Number(t.to_code)] ?? t.to_code}`,
              String(t.moves),
            ]}
          />
        ))}
      </Panel>
      <View style={{ height: space.xl }} />
    </AdminShell>
  );
}
