import { useState } from 'react';
import { View, Image, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
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
  const { width, height } = useWindowDimensions();
  const { id, stepId, readonly } = useLocalSearchParams<{ id: string; stepId: string; readonly?: string }>();
  const { trip } = useTrip(id);
  const step = trip?.steps.find((s) => s.id === stepId);
  const canEdit = (trip?.authorId === 'me' || !trip?.authorId) && readonly !== '1';

  const [hero, setHero] = useState(0);

  if (!trip || !step) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">Loading…</AppText>
      </SafeAreaView>
    );
  }

  // keep everything on one screen: cap the cover image height
  const coverH = Math.min(height * 0.3, 240);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={step.placeName} />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg, paddingTop: space.md }}>
        {/* cover */}
        <Image source={{ uri: step.images[hero] }} style={{ width: '100%', height: coverH, borderRadius: 10, backgroundColor: palette.fill }} resizeMode="cover" />

        {/* thumbnail strip */}
        {step.images.length > 1 && (
          <Row style={{ gap: 6, marginTop: space.sm }}>
            {step.images.slice(0, 8).map((uri, i) => (
              <Pressable key={i} onPress={() => setHero(i)}>
                <Image source={{ uri }} style={[styles.thumb, { borderColor: i === hero ? palette.matcha : 'transparent' }]} resizeMode="cover" />
              </Pressable>
            ))}
          </Row>
        )}

        {/* meta */}
        <Gap h={space.md} />
        <Row style={{ gap: 8, alignItems: 'center' }}>
          <View style={[styles.transport, { backgroundColor: palette.matcha }]}>
            <Ionicons name={transportIcon[step.transport]} size={13} color="#fff" />
            <AppText variant="small" style={{ color: '#fff' }}>{transportLabel[step.transport]}</AppText>
          </View>
          <AppText variant="small" tone="inkFaint">{step.loggedAt.replace(/-/g, '.')} · {step.images.length} photos</AppText>
        </Row>

        <Gap h={space.sm} />
        <Eyebrow tone="matcha">{step.prefectureName}</Eyebrow>
        <Gap h={4} />
        <AppText variant="h2" tone="ink" numberOfLines={1}>{step.title}</AppText>
        <AppText variant="small" tone="inkSoft" numberOfLines={1}>{step.placeName}</AppText>
        <Gap h={space.sm} />
        <AppText variant="body" tone="ink" numberOfLines={4} style={{ lineHeight: 24 }}>{step.note}</AppText>

        {/* footer action pinned to the bottom of the single screen */}
        <View style={{ flex: 1 }} />
        {canEdit ? (
          <Button label="Edit this stop" variant="outline" tone="ink" onPress={() => router.push(`/trip/${trip.id}/step/${step.id}/edit`)} />
        ) : (
          <Row style={{ gap: 6, justifyContent: 'center', paddingVertical: space.md }}>
            <Ionicons name="lock-closed-outline" size={14} color={palette.inkFaint} />
            <AppText variant="small" tone="inkFaint">Read-only — a friend’s trip</AppText>
          </Row>
        )}
        <Gap h={space.sm} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 44, height: 44, borderRadius: 6, borderWidth: 2, backgroundColor: '#eee' },
  transport: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
});
