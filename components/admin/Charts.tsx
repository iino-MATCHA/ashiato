/**
 * 管理画面の分析まわりで使う小さな表示部品。
 * グラフライブラリは入れず、View の幅だけで棒グラフを描く（Web/native 共通）。
 */
import { View, Pressable, StyleSheet } from 'react-native';
import { AppText, Row, Gap } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

export interface BarItem {
  key: string;
  label: string;
  value: number;
  /** 右端に添える補足（例: "12 travellers"） */
  note?: string;
}

/** 横棒のランキング。value の最大値を 100% として描く。 */
export function BarList({
  items,
  max,
  unit = '',
  color,
  limit,
  emptyText = 'No data yet.',
  onPress,
}: {
  items: BarItem[];
  max?: number;
  unit?: string;
  color?: string;
  limit?: number;
  emptyText?: string;
  /** 指定すると行がタップ可能になる（都道府県の詳細へ降りる用途） */
  onPress?: (item: BarItem) => void;
}) {
  const { palette } = useTheme();
  const shown = limit ? items.slice(0, limit) : items;
  const top = max ?? Math.max(1, ...shown.map((i) => i.value));
  const tint = color ?? palette.matcha;

  if (!shown.length) return <AppText variant="small" tone="inkFaint">{emptyText}</AppText>;

  return (
    <View style={{ gap: 10 }}>
      {shown.map((it, i) => {
        const row = (
          <>
            <Row style={{ alignItems: 'baseline', gap: space.sm }}>
              <AppText variant="small" tone="inkFaint" style={{ width: 20 }}>{i + 1}</AppText>
              <AppText variant="small" tone="ink" numberOfLines={1} style={{ flex: 1 }}>{it.label}</AppText>
              {!!it.note && <AppText variant="small" tone="inkFaint">{it.note}</AppText>}
              <AppText variant="small" tone="ink" style={{ minWidth: 44, textAlign: 'right' }}>
                {formatNumber(it.value)}{unit}
              </AppText>
            </Row>
            <Gap h={4} />
            <View style={[styles.track, { backgroundColor: palette.fill }]}>
              <View style={[styles.bar, { width: `${Math.max(2, (it.value / top) * 100)}%`, backgroundColor: tint }]} />
            </View>
          </>
        );
        return onPress ? (
          <Pressable key={it.key} onPress={() => onPress(it)} style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}>
            {row}
          </Pressable>
        ) : (
          <View key={it.key}>{row}</View>
        );
      })}
    </View>
  );
}

/** 構成比を1本の帯で見せる（インバウンド VS 国内 など）。 */
export function StackedBar({ parts }: { parts: { key: string; label: string; value: number; color: string }[] }) {
  const { palette } = useTheme();
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <View>
      <View style={[styles.stack, { backgroundColor: palette.fill }]}>
        {parts.map((p) => (
          <View key={p.key} style={{ flex: p.value / total, backgroundColor: p.color }} />
        ))}
      </View>
      <Gap h={space.sm} />
      <Row style={{ flexWrap: 'wrap', gap: space.md }}>
        {parts.map((p) => (
          <Row key={p.key} style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.color }} />
            <AppText variant="small" tone="inkSoft">
              {p.label} · {Math.round((p.value / total) * 100)}%
            </AppText>
          </Row>
        ))}
      </Row>
    </View>
  );
}

/** 12ヶ月の縦棒。季節性を見るための軸。 */
export function MonthBars({ values, color }: { values: number[]; color?: string }) {
  const { palette } = useTheme();
  const top = Math.max(1, ...values);
  const tint = color ?? palette.matcha;
  return (
    <View>
      <Row style={{ alignItems: 'flex-end', gap: 4, height: 90 }}>
        {values.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <View style={{ width: '100%', height: `${Math.max(2, (v / top) * 100)}%`, backgroundColor: v ? tint : palette.fill, borderRadius: 3 }} />
          </View>
        ))}
      </Row>
      <Gap h={4} />
      <Row style={{ gap: 4 }}>
        {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => (
          <AppText key={i} variant="small" tone="inkFaint" center style={{ flex: 1 }}>{m}</AppText>
        ))}
      </Row>
    </View>
  );
}

/** 軸切り替え用のピル。 */
export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  const { palette } = useTheme();
  return (
    <Row style={{ flexWrap: 'wrap', gap: space.xs }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[styles.pill, { borderColor: on ? palette.matcha : palette.rule }, on && { backgroundColor: palette.matcha }]}
          >
            <AppText variant="small" style={{ color: on ? '#fff' : palette.inkSoft }}>{o.label}</AppText>
          </Pressable>
        );
      })}
    </Row>
  );
}

export function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 3 },
  stack: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: hairline * 2 },
});
