import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Button, Eyebrow } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

const ratios = [
  { key: '9:16', label: 'ストーリーズ', sub: '9 : 16' },
  { key: '1:1', label: 'X / 投稿', sub: '1 : 1' },
] as const;

const swatches = ['#C4432B', '#2B4257', '#A98037', '#1B1815', '#6C8199'];
const items = ['ルートの軌跡', '移動距離', '訪問した都道府県', '獲得した御朱印', '日数', '写真'];

export default function UgcCreate() {
  const { palette } = useTheme();
  const [ratio, setRatio] = useState<string>('9:16');
  const [color, setColor] = useState(swatches[0]);
  const [selected, setSelected] = useState<string[]>(['ルートの軌跡', '移動距離', '訪問した都道府県']);

  const toggle = (t: string) =>
    setSelected((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title="軌跡カードを作る" />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        <Gap h={space.lg} />

        {/* 比率 */}
        <Eyebrow>サイズ</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ gap: space.md }}>
          {ratios.map((r) => {
            const on = ratio === r.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => setRatio(r.key)}
                style={[
                  styles.ratio,
                  { borderColor: on ? palette.ink : palette.rule },
                ]}
              >
                <View
                  style={[
                    styles.ratioIcon,
                    {
                      borderColor: on ? palette.shu : palette.ruleStrong,
                      width: r.key === '1:1' ? 32 : 22,
                      height: 32,
                    },
                  ]}
                />
                <View>
                  <AppText variant="bodyStrong" tone={on ? 'ink' : 'inkSoft'}>{r.label}</AppText>
                  <AppText variant="small" tone="inkFaint">{r.sub}</AppText>
                </View>
              </Pressable>
            );
          })}
        </Row>

        {/* カラー */}
        <Gap h={space.xl} />
        <Eyebrow>カラー</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ gap: space.md }}>
          {swatches.map((s) => (
            <Pressable key={s} onPress={() => setColor(s)}>
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: s },
                  color === s && { borderWidth: 2, borderColor: palette.ink },
                ]}
              />
            </Pressable>
          ))}
        </Row>

        {/* 表示項目 */}
        <Gap h={space.xl} />
        <Eyebrow>カードに載せる項目</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ gap: space.sm, flexWrap: 'wrap' }}>
          {items.map((t) => {
            const on = selected.includes(t);
            return (
              <Pressable
                key={t}
                onPress={() => toggle(t)}
                style={[
                  styles.item,
                  { borderColor: on ? palette.ai : palette.rule },
                  on && { backgroundColor: palette.ai },
                ]}
              >
                {on && <Ionicons name="checkmark" size={13} color={palette.paper} />}
                <AppText variant="small" style={{ color: on ? palette.paper : palette.inkSoft }}>
                  {t}
                </AppText>
              </Pressable>
            );
          })}
        </Row>

        <View style={{ flex: 1 }} />
        <Row style={{ gap: 6, marginBottom: space.sm }}>
          <Ionicons name="construct-outline" size={13} color={palette.inkFaint} />
          <AppText variant="small" tone="inkFaint">
            高画質レンダリング（Skia）は実装予定です。
          </AppText>
        </Row>
        <Button
          label="プレビューを生成"
          tone="shu"
          onPress={() => router.push('/ugc/preview')}
        />
        <Gap h={space.md} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ratio: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: hairline * 2,
    borderRadius: 3,
    padding: space.md,
  },
  ratioIcon: { borderWidth: 2, borderRadius: 2 },
  swatch: { width: 40, height: 40, borderRadius: 20 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: hairline * 2,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
