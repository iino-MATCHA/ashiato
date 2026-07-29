import { useEffect, useRef, useState } from 'react';
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
import { useRippleNav } from '@/lib/transition';
import { setLegTransport } from '@/lib/api';
import { bump } from '@/lib/refresh';
import { transportLabel, type Step, type TransportMode } from '@/lib/mock';
import { useI18n } from '@/lib/i18n';
import { AutoTripModal } from '@/components/AutoTripModal';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useSession } from '@/lib/useSession';

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
  const { navigate } = useRippleNav();
  const { t } = useI18n();

  const CARD_W = Math.min(width * 0.8, 340);
  const SNAP = CARD_W + CARD_GAP;
  const compact = width < 480; // スマホ幅ではヘッダーのチップを詰める

  // active = carousel index. 0 = overview, 1..n = stops, n+1 = add card.
  const [active, setActive] = useState(0);
  const [picker, setPicker] = useState<number | null>(null);
  const [blocked, setBlocked] = useState(false);
  // 写真から立ち寄り先を足すモーダル
  const [fromPhotos, setFromPhotos] = useState(false);
  // 未ログイン閲覧（共有リンク経由）を許すので、案内を出し分ける
  const { signedIn, guest } = useSession();
  const [askSignIn, setAskSignIn] = useState<null | 'save' | 'order'>(null);
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);
  const [modes, setModes] = useState<TransportMode[]>([]);
  const scrollRef = useRef<ScrollView | null>(null);

  const steps = trip?.steps ?? [];
  const n = steps.length;

  // after adding a stop (or on first load) return to the overview instead of
  // slamming the camera onto the newest pin
  useEffect(() => {
    setActive(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [n]);
  const canEdit = (trip?.authorId === 'me' || !trip?.authorId) && readonly !== '1';
  // 他人の旅は「サンプル」と「他の旅人の旅」で扱いを分ける
  const isSample = !!trip?.sample;
  const isFellow = !canEdit && !isSample;
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
    const maxIdx = n + (isFellow ? 0 : 1); // overview + stops (+ add card)
    const clamped = Math.max(0, Math.min(maxIdx, idx));
    if (clamped !== active) setActive(clamped);
  };
  const selectFromMap = (stopIdx: number) => {
    const carouselIdx = stopIdx + 1;
    setActive(carouselIdx);
    scrollRef.current?.scrollTo({ x: carouselIdx * SNAP, animated: true });
  };
  const setLegMode = async (stopIdx: number, mode: TransportMode) => {
    const before = effModes.slice();
    const base = effModes.slice();
    base[stopIdx] = mode;
    setModes(base); // 先に画面へ反映
    setPicker(null);
    if (!canEdit) return;
    const toLog = steps[stopIdx];
    if (!toLog) return;
    // 保存して、他の画面（一覧など）にも反映されるようにする
    const ok = await setLegTransport(trip.id, toLog.id, mode);
    if (ok) {
      bump('trips');
    } else {
      setModes(before); // 保存できなかったら見た目も戻す（嘘をつかない）
      setNotice({ title: 'Could not save', body: 'The transport change was not saved. Check your connection and try again.' });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1b2a' }} edges={['top']}>
      <View style={StyleSheet.absoluteFill}>
        <TripMap steps={steps} activeIndex={mapStop} overview={isOverview} onSelect={selectFromMap} height={winH} bottomInset={240} modes={effModes} />
      </View>

      {/* Header — back + title stay top-left; action icons float top-right */}
      <View style={styles.headerZone} pointerEvents="box-none">
        <Glass onPress={() => router.back()} icon="arrow-back" palette={palette} />
        <Gap h={space.sm} />
        {/* fixed dark text — the pill is always white-ish, even in dark mode.
            スマホでは地図が狭いので、チップを小さく・半透明にして地図を隠さない */}
        <View style={styles.titleGlass}>
          <AppText variant="small" style={{ color: '#5E5B57', fontSize: compact ? 10 : 12, lineHeight: compact ? 13 : 16 }} numberOfLines={1}>
            {trip.subtitle}
          </AppText>
          <AppText variant="h3" style={{ color: '#171717', fontSize: compact ? 14 : 18, lineHeight: compact ? 19 : 24 }} numberOfLines={1}>
            {trip.title}
          </AppText>
        </View>
        {/* 自分の旅とサンプルはボタンを出す。他の旅人の旅では共有・設定を出さない */}
        <View style={styles.actionCol} pointerEvents="box-none">
          {!isFellow && (
            <>
              <Glass onPress={() => router.push(`/trip/${trip.id}/share`)} icon="share-outline" palette={palette} />
              <Glass onPress={() => (guest ? setAskSignIn('order') : router.push(`/trip/${trip.id}/bind` as any))} icon="book-outline" palette={palette} />
              <Glass onPress={() => (canEdit ? router.push(`/trip/${trip.id}/edit`) : setBlocked(true))} icon="settings-outline" palette={palette} />
              {/* 写真を選ぶだけで立ち寄り先を足す。手入力の「＋」は下のドックに残す */}
              <Glass onPress={() => (canEdit ? setFromPhotos(true) : setBlocked(true))} icon="images-outline" palette={palette} />
            </>
          )}
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
              <AppText variant="h3" tone="ink">{t('trip.wholeRoute')}</AppText>
              <AppText variant="small" tone="inkFaint">{n} stops · {trip.distanceKm.toLocaleString()} km</AppText>
              <Gap h={space.xs} />
              <AppText variant="small" tone="matcha">{t('trip.swipe')}</AppText>
            </Pressable>
          </View>

          {/* Stop cards */}
          {steps.map((s, i) => (
            <View key={s.id} style={{ width: CARD_W, marginRight: CARD_GAP }}>
              {/* connector to the previous stop (leg i) — not before the first stop */}
              {i > 0 && (
                <Connector mode={effModes[i]} gap={CARD_GAP} editable={canEdit} palette={palette} onPress={() => (canEdit ? setPicker(i) : setBlocked(true))} />
              )}
              <LocationCard step={s} index={i} total={n} palette={palette} onOpen={(e: any) => navigate(`/trip/${trip.id}/step/${s.id}${canEdit ? '' : '?readonly=1'}`, e)} />
            </View>
          ))}

          {/* Add card — 自分の旅とサンプルで表示（サンプルは押すと案内）。
              他の旅人の旅では編集を誘う要素なので出さない */}
          {!isFellow && (
            <View style={{ width: CARD_W, marginRight: CARD_GAP }}>
              <Connector mode={'car'} gap={CARD_GAP} editable={false} palette={palette} onPress={() => {}} plus />
              <Pressable
                onPress={() => (canEdit ? router.push(`/trip/${trip.id}/step/new`) : setBlocked(true))}
                style={[styles.addCard, { borderColor: palette.matcha }]}
              >
                <Ionicons name="add-circle" size={34} color={palette.matcha} />
                <Gap h={space.sm} />
                <AppText variant="bodyStrong" tone="matcha">{t('trip.addStop')}</AppText>
                <AppText variant="small" tone="inkFaint">{t('trip.addStopSub')}</AppText>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>

      {/* サンプル／他人の旅を編集しようとしたときの中央ポップアップ。
          未ログイン（共有リンクから来た人）にはサインアップへの導線を出す */}
      <Modal visible={blocked} transparent animationType="fade" onRequestClose={() => setBlocked(false)}>
        <Pressable style={styles.centerBackdrop} onPress={() => setBlocked(false)}>
          <Pressable style={[styles.centerModal, { backgroundColor: palette.washi }]} onPress={() => {}}>
            <Ionicons name={signedIn === false ? 'footsteps-outline' : 'eye-outline'} size={30} color={palette.matcha} />
            <Gap h={space.sm} />
            <AppText variant="h3" tone="ink" center>
              {signedIn === false ? t('trip.guestTitle') : isFellow ? t('trip.fellowTitle') : t('trip.sampleTitle')}
            </AppText>
            <Gap h={space.xs} />
            <AppText variant="small" tone="inkSoft" center>
              {signedIn === false ? t('trip.guestBody') : isFellow ? t('trip.fellowBody') : t('trip.sampleBody')}
            </AppText>
            <Gap h={space.lg} />
            {signedIn === false ? (
              <Row style={{ gap: space.sm }}>
                <Pressable onPress={() => setBlocked(false)} style={[styles.centerBtn, { backgroundColor: palette.fill }]}>
                  <AppText variant="small" tone="inkSoft">{t('common.later')}</AppText>
                </Pressable>
                <Pressable onPress={() => { setBlocked(false); router.push('/(auth)/login'); }} style={[styles.centerBtn, { backgroundColor: palette.matcha }]}>
                  <AppText variant="small" style={{ color: '#fff' }}>{t('common.signin')}</AppText>
                </Pressable>
              </Row>
            ) : (
              <Pressable onPress={() => setBlocked(false)} style={[styles.centerBtn, { backgroundColor: palette.matcha }]}>
                <AppText variant="small" style={{ color: '#fff' }}>{t('common.gotit')}</AppText>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* 保存に失敗したときの通知 */}
      <Modal visible={notice !== null} transparent animationType="fade" onRequestClose={() => setNotice(null)}>
        <Pressable style={styles.centerBackdrop} onPress={() => setNotice(null)}>
          <Pressable style={[styles.centerModal, { backgroundColor: palette.washi }]} onPress={() => {}}>
            <Ionicons name="cloud-offline-outline" size={30} color={palette.shu} />
            <Gap h={space.sm} />
            <AppText variant="h3" tone="ink" center>{notice?.title}</AppText>
            <Gap h={space.xs} />
            <AppText variant="small" tone="inkSoft" center>{notice?.body}</AppText>
            <Gap h={space.lg} />
            <Pressable onPress={() => setNotice(null)} style={[styles.centerBtn, { backgroundColor: palette.matcha }]}>
              <AppText variant="small" style={{ color: '#fff' }}>{t('common.close')}</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Transport picker */}
      <Modal visible={picker !== null} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setPicker(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: palette.washi }]} onPress={() => {}}>
            <AppText variant="h3" tone="ink">{t('trip.transportQ')}</AppText>
            <AppText variant="small" tone="inkFaint">{t('trip.transportNote')}</AppText>
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

      {/* 写真から立ち寄り先を足す。閉じたらこの旅に留まる（useTrip が拾い直す） */}
      <AutoTripModal visible={fromPhotos} tripId={trip.id} onClose={() => setFromPhotos(false)} />
      <SignInPrompt visible={askSignIn !== null} onClose={() => setAskSignIn(null)} reason={askSignIn ?? 'save'} />
    </SafeAreaView>
  );
}

function Glass({ onPress, icon }: any) {
  // fixed dark icon on a white circle — readable in light AND dark browser themes
  return (
    <Pressable onPress={onPress} style={styles.glassCircle} hitSlop={8}>
      <Ionicons name={icon} size={20} color="#1B1815" />
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

function LocationCard({ step, index, total, palette, onOpen }: { step: Step; index: number; total: number; palette: any; onOpen: (e?: any) => void }) {
  return (
    <Pressable onPress={(e) => onOpen(e)} style={[styles.card, { backgroundColor: palette.washi }]}>
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
  headerZone: { position: 'absolute', top: space.md, left: space.lg, right: space.lg, zIndex: 20, alignItems: 'flex-start' },
  actionCol: { position: 'absolute', top: 0, right: 0, gap: space.sm, zIndex: 30 },
  glassCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.08)', shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  // 右上のアクション列(46px)にタイトルが被らないよう、幅と右余白を確保する。
  // 背景は半透明にして、チップの下の地図（ピン）が透けて見えるようにする
  titleGlass: { alignSelf: 'flex-start', maxWidth: '62%', marginRight: 58, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 12, paddingHorizontal: space.sm + 2, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
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
  centerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  centerModal: { width: '100%', maxWidth: 320, borderRadius: 16, padding: space.lg, alignItems: 'center', ...shadow },
  centerBtn: { paddingHorizontal: space.xl, paddingVertical: 10, borderRadius: 999 },
  sheet: { padding: space.lg, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: space.xxl },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: hairline * 2, paddingHorizontal: space.md, paddingVertical: 9, borderRadius: 999 },
});
