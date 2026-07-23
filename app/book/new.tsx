import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Button, Eyebrow } from '@/components/ui';
import { space, hairline, fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { findTrip } from '@/lib/mock';

const steps = [
  { icon: 'sparkles-outline', label: 'レイアウト自動生成', desc: '旅の写真・日記・ルートから冊子を自動構成' },
  { icon: 'create-outline', label: 'ページを編集', desc: '写真の入れ替え・文章の調整' },
  { icon: 'cube-outline', label: 'サイズ・製本を選ぶ', desc: 'A5 / A4・ソフト / ハードカバー' },
  { icon: 'home-outline', label: '配送先と決済', desc: '住所入力・Stripe決済（ギフト配送も可）' },
];

export default function BookNew() {
  const { palette } = useTheme();
  const { trip: tripId } = useLocalSearchParams<{ trip: string }>();
  const trip = findTrip(tripId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title="フォトブックにする" />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        <Gap h={space.xl} />

        {/* 表紙プレビュー（縦長の本） */}
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.cover, { backgroundColor: palette.ai }]}>
            <View style={[styles.spine, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />
            <View style={{ padding: space.lg, justifyContent: 'space-between', flex: 1 }}>
              <AppText variant="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>
                ASHIATO BOOK
              </AppText>
              <View>
                <AppText style={styles.coverTitle}>{trip.title}</AppText>
                <Gap h={space.xs} />
                <AppText variant="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {trip.startDate.replace(/-/g, '.')} — {trip.prefectures.join('・')}
                </AppText>
              </View>
            </View>
          </View>
          <Gap h={space.md} />
          <AppText variant="small" tone="inkFaint">
            {trip.stepCount}ステップ・{trip.goshuinCount}御朱印から生成
          </AppText>
        </View>

        {/* フロー */}
        <Gap h={space.xl} />
        <Eyebrow>製本までの流れ</Eyebrow>
        <Gap h={space.sm} />
        <Rule />
        {steps.map((s, i) => (
          <View key={s.label}>
            <Row style={{ gap: space.md, paddingVertical: space.md, alignItems: 'center' }}>
              <AppText variant="h3" tone="inkFaint" style={{ width: 26 }}>
                {String(i + 1).padStart(2, '0')}
              </AppText>
              <Ionicons name={s.icon as any} size={20} color={palette.ai} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" tone="ink">{s.label}</AppText>
                <AppText variant="small" tone="inkFaint">{s.desc}</AppText>
              </View>
            </Row>
            <Rule />
          </View>
        ))}

        <View style={{ flex: 1 }} />
        <Row style={{ gap: 6, marginBottom: space.sm }}>
          <Ionicons name="construct-outline" size={13} color={palette.inkFaint} />
          <AppText variant="small" tone="inkFaint">
            レイアウト自動生成・PDF出力（pdf-lib）と決済は実装予定です。
          </AppText>
        </Row>
        <Button label="レイアウトを生成する" tone="ai" onPress={() => {}} />
        <Gap h={space.md} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: 190,
    height: 260,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  spine: { width: 8, height: '100%' },
  coverTitle: {
    fontFamily: fonts.minchoBold,
    fontSize: 24,
    lineHeight: 32,
    color: '#fff',
  },
});
