import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { trips, acquiredCount } from '@/lib/mock';

const settings = [
  { icon: 'battery-half-outline', label: 'バッテリー・省電力設定', note: '記録の精度と電池のバランス' },
  { icon: 'receipt-outline', label: '注文履歴', note: '製本・ギフトの購入' },
  { icon: 'notifications-outline', label: '通知設定' },
  { icon: 'lock-closed-outline', label: 'プライバシー・公開範囲' },
  { icon: 'help-circle-outline', label: 'お問い合わせ' },
] as const;

export default function Profile() {
  const { palette } = useTheme();
  const totalDistance = trips.reduce((s, t) => s + t.distanceKm, 0);
  const totalSteps = trips.reduce((s, t) => s + t.stepCount, 0);

  return (
    <Screen>
      <Gap h={space.md} />
      {/* プロフィール見出し */}
      <Row style={{ gap: space.md, alignItems: 'center' }}>
        <View style={[styles.avatar, { backgroundColor: palette.ai }]}>
          <AppText variant="h1" style={{ color: palette.paper }}>太</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="h2" tone="ink">山田 太郎</AppText>
          <AppText variant="small" tone="inkFaint">@taro</AppText>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.edit,
            { borderColor: palette.ruleStrong },
            pressed && { opacity: 0.6 },
          ]}
        >
          <AppText variant="small" tone="inkSoft">編集</AppText>
        </Pressable>
      </Row>

      {/* 移動統計 — 大きな数字を横に並べ、縦罫で区切る */}
      <Gap h={space.xl} />
      <Eyebrow>これまでの移動</Eyebrow>
      <Gap h={space.md} />
      <Row style={{ alignItems: 'stretch' }}>
        <Stat value={String(trips.length)} label="旅" palette={palette} />
        <Rule vertical />
        <Stat value={String(totalSteps)} label="ステップ" palette={palette} />
        <Rule vertical />
        <Stat value={String(acquiredCount)} label="御朱印" palette={palette} />
      </Row>
      <Gap h={space.lg} />
      <Row style={[styles.distance, { borderColor: palette.rule }]}>
        <View>
          <AppText variant="eyebrow" tone="inkFaint">総移動距離</AppText>
          <Gap h={2} />
          <Row style={{ alignItems: 'flex-end', gap: 4 }}>
            <AppText variant="display" tone="shu" style={{ lineHeight: 44 }}>
              {totalDistance.toLocaleString()}
            </AppText>
            <AppText variant="h3" tone="inkFaint" style={{ marginBottom: 6 }}>km</AppText>
          </Row>
        </View>
        <Ionicons name="trail-sign-outline" size={40} color={palette.rule} />
      </Row>

      {/* 設定リスト */}
      <Gap h={space.xl} />
      <Eyebrow tone="ai">設定</Eyebrow>
      <Gap h={space.md} />
      <Rule />
      {settings.map((s) => (
        <View key={s.label}>
          <Pressable style={({ pressed }) => [styles.setting, pressed && { opacity: 0.6 }]}>
            <Ionicons name={s.icon as any} size={20} color={palette.inkSoft} />
            <View style={{ flex: 1 }}>
              <AppText variant="body" tone="ink">{s.label}</AppText>
              {'note' in s && s.note && (
                <AppText variant="small" tone="inkFaint">{s.note}</AppText>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
          </Pressable>
          <Rule />
        </View>
      ))}

      <Gap h={space.xl} />
      <Pressable
        onPress={() => router.replace('/(auth)/login')}
        style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
      >
        <AppText variant="body" tone="inkFaint" center>ログアウト</AppText>
      </Pressable>
    </Screen>
  );
}

function Stat({ value, label, palette }: any) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: space.sm }}>
      <AppText variant="h1" tone="ink">{value}</AppText>
      <AppText variant="eyebrow" tone="inkFaint">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  edit: {
    borderWidth: hairline * 2,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: 2,
  },
  distance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: hairline,
    borderRadius: 3,
    padding: space.lg,
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
});
