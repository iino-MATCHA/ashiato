import { useRef, useState } from 'react';
import {
  View, ScrollView, Pressable, StyleSheet, Image, Modal,
  useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Gap } from '@/components/ui';
import { TripMap } from '@/components/map/TripMap';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrip } from '@/lib/useData';
import { transportLabel, type Step, type TransportMode } from '@/lib/mock';

const transportIcon: Record<TransportMode, any> = {
  car: 'car-outline', train: 'subway-outline', shinkansen: 'train-outline',
  plane: 'airplane-outline', walk: 'walk-outline', ferry: 'boat-outline', bus: 'bus-outline',
};
const MODE_OPTIONS: TransportMode[] = ['shinkansen', 'train', 'car', 'bus', 'plane', 'ferry', 'walk'];
const CARD_GAP = 68;

export default function TripDetail() {
  const { palette } = useTheme();
  const { width, height: winH } = useWindowDimensions();
  const { id, readonly } = useLocalSearchParams<{ id: string; readonly?: string }>();
  const { trip, loading } = useTrip(id);

  const CARD_W = Math.min(width * 0.8, 340);
  const SNAP = CARD_W + CARD_GAP;

  // active = carousel index. 0 = overview, 1..n = stops, n+1 = add card.
  const [active, setActive] = useState(0);
  const [picker, setPicker] = useState<number | null>(null);
  const [modes, setModes] = useState<TransportMode[]>([]);
  const scrollRef = useRef<ScrollView | null>(null);

  const steps = trip?.steps ?? [];
  const n = steps.length;
  const canEdit = (trip?.authorId === 'me' || !trip?.authorId) && readonly !== '1';
  const effModes = modes.length === n && n > 0 ? modes : steps.map((s) => s.transport);
  const sideInset = (width - CARD_W) / 2;

  if (!trip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">{loading ? 'Loading…' : 'Trip not found'}</AppText>
      </SafeAreaView>
    );
  }

  const isOverview = active === 0;
  const mapStop = Math.max(0, Math.min(n - 1, active - 1));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP);
    const maxIdx = n + (canEdit ? 1 : 0);
    const clamped = Math.max(0, Math.min(maxIdx, idx));
    if (clamped !== active) setActive(clamped);
  };
  const selectFromMap = (stopIdx: number) => {
    const carouselIdx = stopIdx + 1;
    setActive(carouselIdx);
    scrollRef.current?.scrollTo({ x: carouselIdx * SNAP, animated: true });
  };
  const setLegMode = (stopIdx: number, mode: TransportMode) => {
    const base = effModes.slice();
    base[stopIdx] = mode;
    setModes(base);
    setPicker(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
      <View style={StyleSheet.absoluteFill}>
        <TripMap steps={steps} activeIndex={mapStop} overview={isOverview} onSelect={selectFromMap} height={winH} bottomInset={240} modes={effModes} />
      </View>

      {/* Header */}
      <View style={styles.headerZone} pointerEvents="box-none">
        <Row style={{ justifyContent: 'space-between' }}>
          <Glass onPress={() => router.back()} icon="arrow-back" palette={palette} />
          <Glass onPress={() => router.push(`/ugc/create?trip=${trip.id}`)} icon="share-social-outline" palette={palette} />
        </Row>
        <Gap h={space.sm} />
        <View style={styles.titleGlass}>
          <AppText variant="small" tone="inkFaint">{trip.subtitle}</AppText>
          <AppText variant="h3" tone="ink" numberOfLines={1}>{trip.title}</AppText>
        </View>
      </View>

      {/* Bottom carousel */}
      <View style={styles.dock} pointerEvents="box-none">
        <Row style={{ justifyContent: 'center', gap: 6, marginBottom: space.sm }}>
          {steps.map((_, i) => (
            <View key={i} style={{ width: active - 1 === i ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: active - 1 === i ? palette.matcha : 'rgba(255,255,255,0.7)' }} />
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
          {/* Overview card (far left) */}
          <View style={{ width: CARD_W, marginRight: CARD_GAP }}>
            <Pressable onPress={() => selectFromMap(0)} style={[styles.overviewCard, { backgroundColor: palette.washi }]}>
              <Ionicons name="map-outline" size={26} color={palette.matcha} />
              <Gap h={space.sm} />
              <AppText variant="h3" tone="ink">The whole route</AppText>
              <AppText variant="small" tone="inkFaint">{n} stops · {trip.distanceKm.toLocaleString()} km</AppText>
              <Gap h={space.xs} />
              <AppText variant="small" tone="matcha">Swipe → to follow the journey</AppText>
            </Pressable>
          </View>

          {/* Stop cards */}
          {steps.map((s, i) => (
            <View key={s.id} style={{ width: CARD_W, marginRight: CARD_GAP }}>
              {/* connector to the previous stop (leg i) — not before the first stop */}
              {i > 0 && (
                <Connector mode={effModes[i]} gap={CARD_GAP} editable={canEdit} palette={palette} onPress={() => canEdit && setPicker(i)} />
              )}
              <LocationCard step={s} index={i} total={n} palette={palette} onOpen={() => router.push(`/trip/${trip.id}/step/${s.id}${canEdit ? '' : '?readonly=1'}`)} />
            </View>
          ))}

          {/* Add card (editable only) */}
          {canEdit && (
            <View style={{ width: CARD_W, marginRight: CARD_GAP }}>
              <Connector mode={'car'} gap={CARD_GAP} editable={false} palette={palette} onPress={() => {}} plus />
              <Pressable onPress={() => router.push(`/trip/${trip.id}/step/new`)} style={[styles.addCard, { borderColor: palette.matcha }]}>
                <Ionicons name="add-circle" size={34} color={palette.matcha} />
                <Gap h={space.sm} />
                <AppText variant="bodyStrong" tone="matcha">Add a new stop</AppText>
                <AppText variant="small" tone="inkFaint">Photos, notes, check-in</AppText>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Transport picker */}
      <Modal visible={picker !== null} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setPicker(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: palette.washi }]} onPress={() => {}}>
            <AppText variant="h3" tone="ink">How did you travel?</AppText>
            <AppText variant="small" tone="inkFaint">Flights and ferries are drawn as an arc.</AppText>
            <Gap h={space.md} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {MODE_OPTIONS.map((m) => {
                const on = picker !== null && effModes[picker] === m;
                return (
                  <Pressable key={m} onPress={() => picker !== null && setLegMode(picker, m)}
                    style={[styles.modeChip, { borderColor: on ? palette.matcha : palette.rule }, on && { backgroundColor: palette.matcha }]}>
                    <Ionicons name={transportIcon[m]} size={16} color={on ? '#fff' : palette.inkSoft} />
                    <AppText variant="small" style={{ color: on ? '#fff' : palette.inkSoft }}>{transportLabel[m]}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Glass({ onPress, icon, palette }: any) {
  return (
    <Pressable onPress={onPress} style={styles.glassCircle} hitSlop={8}>
      <Ionicons name={icon} size={20} color={palette.ink} />
    </Pressable>
  );
}

function Connector({ mode, gap, editable, palette, onPress, plus }: { mode: TransportMode; gap: number; editable: boolean; palette: any; onPress: () => void; plus?: boolean }) {
  return (
    <View style={[styles.connector, { left: -gap, width: gap }]} pointerEvents="box-none">
      <View style={styles.connectorLine} />
      <Pressable onPress={onPress} style={[styles.connectorChip, { backgroundColor: palette.washi, borderColor: plus ? palette.ruleStrong : palette.matcha }]}>
        <Ionicons name={plus ? 'ellipsis-horizontal' : transportIcon[mode]} size={16} color={plus ? palette.inkFaint : palette.matcha} />
        {editable && !plus && <View style={[styles.connectorEditDot, { backgroundColor: palette.matcha }]} />}
      </Pressable>
    </View>
  );
}

function LocationCard({ step, index, total, palette, onOpen }: { step: Step; index: number; total: number; palette: any; onOpen: () => void }) {
  return (
    <Pressable onPress={onOpen} style={[styles.card, { backgroundColor: palette.washi }]}>
      <View style={{ position: 'relative' }}>
        <View style={[styles.cardPhoto, { backgroundColor: palette.fill }]}>
          <Image source={{ uri: step.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        <View style={[styles.photoCount, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <Ionicons name="images-outline" size={12} color="#fff" />
          <AppText variant="small" style={{ color: '#fff' }}>{step.images.length}</AppText>
        </View>
      </View>
      <View style={{ padding: space.md }}>
        <AppText variant="eyebrow" tone="inkFaint">Stop {index + 1} / {total} · {step.prefectureName}</AppText>
        <Gap h={4} />
        <AppText variant="h3" tone="ink" numberOfLines={1}>{step.title}</AppText>
        <AppText variant="small" tone="inkSoft" numberOfLines={1}>{step.placeName}</AppText>
        <Gap h={space.xs} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="small" tone="inkSoft" numberOfLines={1} style={{ flex: 1 }}>{step.note}</AppText>
          <Ionicons name="chevron-forward" size={16} color={palette.inkFaint} />
        </Row>
      </View>
    </Pressable>
  );
}

const shadow = { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 5 };

const styles = StyleSheet.create({
  headerZone: { position: 'absolute', top: space.xl, left: space.lg, right: space.lg, zIndex: 20 },
  glassCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.85)', ...shadow },
  titleGlass: { alignSelf: 'flex-start', maxWidth: '85%', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 14, paddingHorizontal: space.md, paddingVertical: space.sm, ...shadow },
  dock: { position: 'absolute', bottom: space.lg, left: 0, right: 0, zIndex: 20 },
  card: { borderRadius: 12, overflow: 'hidden', ...shadow },
  cardPhoto: { width: '100%', height: 140, overflow: 'hidden' },
  photoCount: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  overviewCard: { borderRadius: 12, padding: space.lg, minHeight: 210, justifyContent: 'center', ...shadow },
  addCard: { borderRadius: 12, borderWidth: hairline * 2, borderStyle: 'dashed', minHeight: 210, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.9)' },
  connector: { position: 'absolute', top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  connectorLine: { position: 'absolute', left: 4, right: 4, top: '50%', height: 2, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 1 },
  connectorChip: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', ...shadow },
  connectorEditDot: { position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#fff' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { padding: space.lg, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: space.xxl },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: hairline * 2, paddingHorizontal: space.md, paddingVertical: 9, borderRadius: 999 },
});
