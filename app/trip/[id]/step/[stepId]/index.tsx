import { View, Image, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrip } from '@/lib/useData';
import { transportLabel, type TransportMode } from '@/lib/mock';

const transportIcon: Record<TransportMode, any> = {
  car: 'car-outline', train: 'subway-outline', shinkansen: 'train-outline',
  plane: 'airplane-outline', walk: 'walk-outline', ferry: 'boat-outline', bus: 'bus-outline',
};

export default function StepDetail() {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const { id, stepId } = useLocalSearchParams<{ id: string; stepId: string }>();
  const { trip } = useTrip(id);
  const step = trip?.steps.find((s) => s.id === stepId);
  const canEdit = trip?.authorId === 'me' || !trip?.authorId;

  if (!trip || !step) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">Loading…</AppText>
      </SafeAreaView>
    );
  }

  const imgW = width - space.lg * 2;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={step.placeName} />
      <Rule />
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
        {/* Photo gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.sm, paddingVertical: space.md }}
        >
          {step.images.map((uri, i) => (
            <Image key={i} source={{ uri }} style={{ width: imgW, height: imgW * 0.7, borderRadius: 8, backgroundColor: palette.fill }} resizeMode="cover" />
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: space.lg }}>
          <Row style={{ gap: 6, alignItems: 'center' }}>
            <View style={[styles.transport, { backgroundColor: palette.matcha }]}>
              <Ionicons name={transportIcon[step.transport]} size={13} color="#fff" />
              <AppText variant="small" style={{ color: '#fff' }}>{transportLabel[step.transport]}</AppText>
            </View>
            <AppText variant="small" tone="inkFaint">{step.loggedAt.replace(/-/g, '.')}</AppText>
            <AppText variant="small" tone="inkFaint">· {step.images.length} photos</AppText>
          </Row>

          <Gap h={space.md} />
          <Eyebrow tone="matcha">{step.prefectureName}</Eyebrow>
          <Gap h={space.xs} />
          <AppText variant="h1" tone="ink">{step.title}</AppText>
          <AppText variant="body" tone="inkSoft">{step.placeName}</AppText>

          <Gap h={space.lg} />
          <AppText variant="body" tone="ink" style={{ lineHeight: 26 }}>{step.note}</AppText>

          <Gap h={space.xl} />
          {canEdit ? (
            <Button
              label="Edit this stop"
              variant="outline"
              tone="ink"
              onPress={() => router.push(`/trip/${trip.id}/step/${step.id}/edit`)}
            />
          ) : (
            <Row style={{ gap: 6, justifyContent: 'center' }}>
              <Ionicons name="lock-closed-outline" size={14} color={palette.inkFaint} />
              <AppText variant="small" tone="inkFaint">Read-only — this is a friend’s trip</AppText>
            </Row>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  transport: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
});
