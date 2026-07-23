import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Screen, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { findTrip, type Step } from '@/lib/mock';

export default function TripDetail() {
  const { palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = findTrip(id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top']}>
      <Header
        right={
          <Pressable hitSlop={10}>
            <Ionicons name="ellipsis-horizontal" size={22} color={palette.ink} />
          </Pressable>
        }
      />
      <Screen edges={[]}>
        {/* 見出し */}
        <AppText variant="eyebrow" tone="shu">
          {trip.startDate.replace(/-/g, '.')} – {trip.endDate.replace(/-/g, '.')}
        </AppText>
        <Gap h={space.sm} />
        <AppText variant="h1" tone="ink">{trip.title}</AppText>
        <Gap h={space.sm} />
        <Row style={{ gap: space.sm, flexWrap: 'wrap' }}>
          {trip.prefectures.map((p) => (
            <AppText key={p} variant="small" tone="inkSoft">
              {p}
            </AppText>
          ))}
          <AppText variant="small" tone="inkFaint">·  {trip.members.join('、')}</AppText>
        </Row>

        {/* 統計 */}
        <Gap h={space.lg} />
        <Row style={{ alignItems: 'stretch' }}>
          <Stat value={`${trip.distanceKm}`} unit="km" label="移動距離" palette={palette} />
          <Rule vertical />
          <Stat value={`${trip.stepCount}`} label="ステップ" palette={palette} />
          <Rule vertical />
          <Stat value={`${trip.goshuinCount}`} label="御朱印" palette={palette} />
        </Row>

        {/* 導線: UGC / 製本 */}
        <Gap h={space.lg} />
        <Row style={{ gap: space.md }}>
          <ActionTile
            icon="share-social-outline"
            label="軌跡カードを作る"
            sub="SNSでシェア"
            onPress={() => router.push(`/ugc/create?trip=${trip.id}`)}
            tone={palette.shu}
            palette={palette}
          />
          <ActionTile
            icon="book-outline"
            label="フォトブックにする"
            sub="製本して残す"
            onPress={() => router.push(`/book/new?trip=${trip.id}`)}
            tone={palette.ai}
            palette={palette}
          />
        </Row>

        {/* タイムライン（縦のルート線） */}
        <Gap h={space.xl} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>ルートとタイムライン</Eyebrow>
          <Pressable onPress={() => router.push(`/trip/${trip.id}/step/new`)}>
            <Row style={{ gap: 4 }}>
              <Ionicons name="add-circle-outline" size={16} color={palette.ai} />
              <AppText variant="small" tone="ai">Step追加</AppText>
            </Row>
          </Pressable>
        </Row>
        <Gap h={space.lg} />
        {trip.steps.map((s, i) => (
          <TimelineItem
            key={s.id}
            step={s}
            index={i}
            last={i === trip.steps.length - 1}
            palette={palette}
            onPress={() => router.push(`/trip/${trip.id}/step/${s.id}`)}
          />
        ))}
      </Screen>
    </SafeAreaView>
  );
}

function TimelineItem({
  step,
  index,
  last,
  palette,
  onPress,
}: {
  step: Step;
  index: number;
  last: boolean;
  palette: any;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
      <Row style={{ alignItems: 'stretch', gap: space.md }}>
        {/* 左：ルート線とノード */}
        <View style={{ width: 20, alignItems: 'center' }}>
          <View style={[styles.node, { borderColor: palette.shu }]}>
            <View style={[styles.nodeDot, { backgroundColor: palette.shu }]} />
          </View>
          {!last && <View style={[styles.line, { backgroundColor: palette.rule }]} />}
        </View>
        {/* 右：内容 */}
        <View style={{ flex: 1, paddingBottom: space.xl }}>
          <AppText variant="small" tone="inkFaint">
            {step.prefectureName} · {step.placeName}
          </AppText>
          <Gap h={2} />
          <AppText variant="h3" tone="ink">{step.title}</AppText>
          <Gap h={4} />
          <AppText variant="body" tone="inkSoft" numberOfLines={2}>{step.note}</AppText>
          {step.photoCount > 0 && (
            <>
              <Gap h={space.sm} />
              <Row style={{ gap: 4 }}>
                <Ionicons name="images-outline" size={13} color={palette.aiSoft} />
                <AppText variant="small" tone="aiSoft">{step.photoCount}枚</AppText>
              </Row>
            </>
          )}
        </View>
      </Row>
    </Pressable>
  );
}

function Stat({ value, unit, label, palette }: any) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: space.sm }}>
      <Row style={{ alignItems: 'flex-end', gap: 2 }}>
        <AppText variant="h2" tone="ink">{value}</AppText>
        {unit && <AppText variant="small" tone="inkFaint" style={{ marginBottom: 4 }}>{unit}</AppText>}
      </Row>
      <AppText variant="eyebrow" tone="inkFaint">{label}</AppText>
    </View>
  );
}

function ActionTile({ icon, label, sub, onPress, tone, palette }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { borderColor: palette.rule },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Ionicons name={icon} size={22} color={tone} />
      <Gap h={space.sm} />
      <AppText variant="bodyStrong" tone="ink">{label}</AppText>
      <AppText variant="small" tone="inkFaint">{sub}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  node: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  nodeDot: { width: 6, height: 6, borderRadius: 3 },
  line: { width: hairline * 2, flex: 1, marginTop: 4 },
  tile: {
    flex: 1,
    borderWidth: hairline,
    borderRadius: 3,
    padding: space.md,
  },
});
