import { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Gap } from '@/components/ui';
import { TripMap } from '@/components/map/TripMap';
import { space, hairline, fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { transportLabel, type Step, type TransportMode } from '@/lib/mock';
import { useTrip } from '@/lib/useData';

const transportIcon: Record<TransportMode, any> = {
  car: 'car-outline',
  train: 'subway-outline',
  shinkansen: 'train-outline',
  plane: 'airplane-outline',
  walk: 'walk-outline',
  ferry: 'boat-outline',
};

const CARD_GAP = 12;

export default function TripDetail() {
  const { palette } = useTheme();
  const { width, height: winH } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip, loading } = useTrip(id);

  const CARD_W = Math.min(width * 0.82, 360);
  const SNAP = CARD_W + CARD_GAP;
  const sideInset = (width - CARD_W) / 2;

  const [active, setActive] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  if (!trip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">{loading ? 'Loading…' : 'Trip not found'}</AppText>
      </SafeAreaView>
    );
  }
  const steps = trip.steps;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP);
    const clamped = Math.max(0, Math.min(steps.length - 1, idx));
    if (clamped !== active) setActive(clamped);
  };

  // marker tap -> scroll cards to that index
  const selectFromMap = (i: number) => {
    setActive(i);
    scrollRef.current?.scrollTo({ x: i * SNAP, animated: true });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top']}>
      {/* Map fills the screen */}
      <View style={StyleSheet.absoluteFill}>
        <TripMap
          steps={steps}
          activeIndex={active}
          onSelect={selectFromMap}
          height={winH}
          bottomInset={230}
        />
      </View>

      {/* Floating header */}
      <Row style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.circle, { backgroundColor: palette.washi }]} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={palette.ink} />
        </Pressable>
        <View style={[styles.titlePill, { backgroundColor: palette.washi }]}>
          <AppText variant="small" tone="inkFaint">{trip.subtitle}</AppText>
          <AppText variant="bodyStrong" tone="ink" numberOfLines={1}>{trip.title}</AppText>
        </View>
        <Pressable onPress={() => router.push(`/ugc/create?trip=${trip.id}`)} style={[styles.circle, { backgroundColor: palette.washi }]} hitSlop={8}>
          <Ionicons name="share-social-outline" size={19} color={palette.ink} />
        </Pressable>
      </Row>

      {/* Bottom carousel */}
      <View style={styles.dock}>
        {/* progress dots */}
        <Row style={{ justifyContent: 'center', gap: 6, marginBottom: space.sm }}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === active ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === active ? palette.shu : palette.paper,
                opacity: i === active ? 1 : 0.7,
              }}
            />
          ))}
        </Row>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP}
          decelerationRate="fast"
          disableIntervalMomentum
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: sideInset }}
        >
          {steps.map((s, i) => (
            <LocationCard
              key={s.id}
              step={s}
              index={i}
              total={steps.length}
              width={CARD_W}
              gap={CARD_GAP}
              active={i === active}
              palette={palette}
              onOpen={() => router.push(`/trip/${trip.id}/step/${s.id}`)}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function LocationCard({
  step,
  index,
  total,
  width,
  gap,
  active,
  palette,
  onOpen,
}: {
  step: Step;
  index: number;
  total: number;
  width: number;
  gap: number;
  active: boolean;
  palette: any;
  onOpen: () => void;
}) {
  return (
    <Pressable
      onPress={onOpen}
      style={[
        styles.card,
        { width, marginRight: gap, backgroundColor: palette.washi, opacity: active ? 1 : 0.94 },
      ]}
    >
      {/* photo strip (first image large + count) */}
      <View style={{ position: 'relative' }}>
        <View style={[styles.cardPhoto, { backgroundColor: palette.fill }]}>
          {/* first image is used as the location's cover */}
          <Image source={{ uri: step.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        <View style={[styles.photoCount, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <Ionicons name="images-outline" size={12} color="#fff" />
          <AppText variant="small" style={{ color: '#fff' }}>{step.images.length}</AppText>
        </View>
        <View style={[styles.transport, { backgroundColor: palette.shu }]}>
          <Ionicons name={transportIcon[step.transport]} size={13} color="#fff" />
          <AppText variant="small" style={{ color: '#fff' }}>{transportLabel[step.transport]}</AppText>
        </View>
      </View>

      <View style={{ padding: space.md }}>
        <AppText variant="eyebrow" tone="inkFaint">
          Stop {index + 1} / {total} · {step.prefectureName}
        </AppText>
        <Gap h={4} />
        <AppText variant="h3" tone="ink" numberOfLines={1}>{step.title}</AppText>
        <AppText variant="small" tone="inkSoft" numberOfLines={1}>{step.placeName}</AppText>
        <Gap h={space.xs} />
        <AppText variant="small" tone="inkSoft" numberOfLines={2}>{step.note}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: space.xl,
    left: space.lg,
    right: space.lg,
    gap: space.sm,
    zIndex: 20,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  titlePill: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: space.md,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dock: {
    position: 'absolute',
    bottom: space.lg,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  card: {
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardPhoto: { width: '100%', height: 150, overflow: 'hidden' },
  photoCount: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  transport: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
});
