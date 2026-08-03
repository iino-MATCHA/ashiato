/**
 * ボトムシートの中身（旅）。
 * プロフィールへの入口 → 数字 → 「新しい旅」と「御朱印」の2つのボタン →
 * 写真から起こす導線 → 旅の一覧。
 */
import { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Gap, Rule } from '@/components/ui';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { PREFECTURE_TOTAL, type Trip } from '@/lib/mock';
import { useTrips, usePublicTrips } from '@/lib/useData';
import { useProfile } from '@/lib/useProfile';
import { isSupabaseConfigured } from '@/lib/supabase';
import { deleteTrip } from '@/lib/api';
import { CountUp } from '@/components/CountUp';
import { AutoTripModal } from '@/components/AutoTripModal';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useSession } from '@/lib/useSession';
import { useRippleNav } from '@/lib/transition';
import { useI18n, t } from '@/lib/i18n';
import { useSheetOpen } from '@/components/BottomSheet';

export function TripsPane({ visited, onOpenGoshuin }: { visited: number[]; onOpenGoshuin: () => void }) {
  const { palette } = useTheme();
  useI18n(); // 言語切替の再レンダー購読
  // たたんでいる間は動かさない。中を見るにはシートを上げてもらう
  const sheetOpen = useSheetOpen();
  const { trips } = useTrips();
  const { trips: publicTrips } = usePublicTrips();
  const { profile } = useProfile();
  const [menuTrip, setMenuTrip] = useState<Trip | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [autoOpen, setAutoOpen] = useState(false);
  // ゲストは見るだけ。保存が要る操作を押したらその場で促す
  const { guest } = useSession();
  const [askSignIn, setAskSignIn] = useState(false);
  const pct = Math.round((visited.length / PREFECTURE_TOTAL) * 100);

  let ordered = [...trips]
    .filter((x) => !deletedIds.has(x.id))
    .sort((a, b) => (a.status === 'ongoing' ? -1 : b.status === 'ongoing' ? 1 : 0));
  /**
   * サンプルの旅は「まだ何も無い人」への見本なので、
   * 自分の旅が1件でもできたら出さない（自分の記録の上に他人の旅が居座らない）。
   */
  if (isSupabaseConfigured && ordered.length === 0) {
    const sample = publicTrips.find((x) => x.authorId !== 'me' && x.title === 'Japan Grand Tour');
    if (sample) ordered = [{ ...sample, sample: true }];
  }

  const onDelete = async () => {
    const trip = menuTrip;
    setMenuTrip(null);
    if (!trip) return;
    setDeletedIds((cur) => new Set(cur).add(trip.id));
    if (isSupabaseConfigured) await deleteTrip(trip.id);
  };

  return (
    <>
      <ScrollView
        scrollEnabled={sheetOpen}
        showsVerticalScrollIndicator={false}
        // 浮いたタブバーに最後の行が隠れないよう、下を厚めに空ける
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl * 2 }}
      >
        {/* プロフィールへの入口 */}
        <Pressable
          onPress={() => (guest ? setAskSignIn(true) : router.push('/profile'))}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Row style={{ gap: space.md, alignItems: 'center' }}>
            <View style={[styles.avatar, { backgroundColor: palette.fill, borderColor: palette.matcha, borderWidth: 2, overflow: 'hidden' }]}>
              {!guest && profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={22} color={palette.matcha} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" tone="ink">{guest ? t('guest.mapTitle') : profile.name}</AppText>
              <AppText variant="small" tone="inkFaint">
                {guest ? t('guest.signUp') + ' →' : '@' + profile.username}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
          </Row>
        </Pressable>

        {/* 数字 */}
        <Gap h={space.md} />
        <Row style={{ gap: space.lg }}>
          <InlineStat value={pct} suffix="%" label={t('home.ofJapan')} />
          <InlineStat value={visited.length} label={t('home.goshuin')} />
          <InlineStat value={trips.filter((tr) => !tr.sample).length} label={t('home.trips')} />
        </Row>

        {/* 2つの入口。押せるものなので囲う */}
        <Gap h={space.md} />
        <Row style={{ gap: space.sm }}>
          <Pressable
            onPress={() => (guest ? setAskSignIn(true) : router.push('/trip/new'))}
            style={({ pressed }) => [styles.btn, { backgroundColor: palette.matcha }, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="add" size={17} color="#fff" />
            <AppText variant="bodyStrong" style={{ color: '#fff' }}>{t('home.newTrip')}</AppText>
          </Pressable>
          <Pressable
            onPress={onOpenGoshuin}
            style={({ pressed }) => [styles.btn, { borderColor: palette.ruleStrong, borderWidth: StyleSheet.hairlineWidth * 2 }, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="ribbon-outline" size={17} color={palette.shu} />
            <AppText variant="bodyStrong" tone="ink">{t('tab.goshuin')}</AppText>
          </Pressable>
          {/* ここまでの旅路をシェアする。言葉は置かず、共有の印だけ */}
          <Pressable
            onPress={() => (guest ? setAskSignIn(true) : router.push('/goshuin/share'))}
            accessibilityLabel={t('goshuin.share')}
            style={({ pressed }) => [styles.iconBtn, { borderColor: palette.ruleStrong }, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="share-outline" size={19} color={palette.ink} />
          </Pressable>
        </Row>

        {/* 写真から旅を起こす入口。箱で囲わず、面だけで区切る */}
        <Gap h={space.lg} />
        <Pressable
          onPress={() => (guest ? setAskSignIn(true) : setAutoOpen(true))}
          style={({ pressed }) => [styles.autoRow, { backgroundColor: palette.fill }, pressed && { opacity: 0.7 }]}
        >
          <View style={[styles.autoIcon, { backgroundColor: palette.matcha }]}>
            <Ionicons name="images" size={19} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong" tone="ink">{t('auto.cardTitle')}</AppText>
            <AppText variant="small" tone="inkFaint" style={{ lineHeight: 18 }}>{t('auto.cardBody')}</AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
        </Pressable>

        <Gap h={space.lg} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="h3" tone="ink">{t('home.yourTrips')}</AppText>
        </Row>
        <Gap h={space.md} />

        {guest && (
          <>
            {/* ゲストの一覧は空なので、代わりに行き先を示す */}
            <Rule />
            <Gap h={space.md} />
            <Pressable onPress={() => router.push('/(tabs)/explore')} hitSlop={8}>
              <Row style={{ gap: 6, alignItems: 'center' }}>
                <Ionicons name="compass-outline" size={16} color={palette.matcha} />
                <AppText variant="small" tone="matcha">{t('guest.seeOthers')} →</AppText>
              </Row>
            </Pressable>
            <Gap h={space.md} />
            <Rule />
            <Gap h={space.lg} />
          </>
        )}

        {ordered.map((trip) => (
          <TripCard key={trip.id} trip={trip} palette={palette} onEdit={() => setMenuTrip(trip)} />
        ))}
      </ScrollView>

      <AutoTripModal visible={autoOpen} onClose={() => setAutoOpen(false)} />
      <SignInPrompt visible={askSignIn} onClose={() => setAskSignIn(false)} reason="save" />

      {/* 旅ごとの操作（自分の、サンプルでない旅だけ） */}
      <Modal visible={!!menuTrip} transparent animationType="fade" onRequestClose={() => setMenuTrip(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setMenuTrip(null)}>
          <Pressable style={[styles.menuSheet, { backgroundColor: palette.washi }]} onPress={() => {}}>
            <AppText variant="h3" tone="ink" numberOfLines={1}>{menuTrip?.title}</AppText>
            <Gap h={space.md} />
            <Pressable
              onPress={() => { const trip = menuTrip; setMenuTrip(null); if (trip) router.push(`/trip/${trip.id}/edit`); }}
              style={styles.menuRow}
            >
              <Ionicons name="create-outline" size={20} color={palette.ink} />
              <AppText variant="body" tone="ink">{t('home.editTrip')}</AppText>
            </Pressable>
            <Rule />
            <Pressable onPress={onDelete} style={styles.menuRow}>
              <Ionicons name="trash-outline" size={20} color={palette.shu} />
              <AppText variant="body" tone="shu">{t('home.deleteTrip')}</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function isOnTheRoad(trip: Trip): boolean {
  if (!trip.startDate || !trip.endDate) return false;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return trip.startDate <= today && today <= trip.endDate;
}

function TripCard({ trip, palette, onEdit }: { trip: Trip; palette: any; onEdit: () => void }) {
  const { navigate } = useRippleNav();
  const cover = trip.steps[0]?.images[0];
  const ongoing = isOnTheRoad(trip);
  const mine = trip.authorId === 'me' || !trip.authorId;
  const editable = !trip.sample && mine; // sample & others' trips can't be edited/deleted
  const href = `/trip/${trip.id}${editable ? '' : '?readonly=1'}`;
  return (
    <Pressable onPress={(e) => navigate(href, e)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.cover}>
        {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />}
        <View style={styles.coverShade} />
        {ongoing && (
          <View style={[styles.pill, { backgroundColor: palette.matcha }]}>
            <View style={styles.pulse} />
            <AppText variant="eyebrow" style={{ color: '#fff' }}>{t('home.onTheRoad')}</AppText>
          </View>
        )}
        {trip.sample && (
          <View style={[styles.pill, { backgroundColor: 'rgba(43,66,87,0.9)' }]}>
            <Ionicons name="sparkles-outline" size={11} color="#fff" />
            <AppText variant="eyebrow" style={{ color: '#fff' }}>{t('home.sample')}</AppText>
          </View>
        )}
        {editable && (
          <Pressable onPress={onEdit} hitSlop={10} style={styles.cardMenu}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
          </Pressable>
        )}
        <View style={styles.coverText}>
          <AppText variant="h2" style={{ color: '#fff' }} numberOfLines={2}>{trip.title}</AppText>
          <AppText variant="small" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {trip.startDate.replace(/-/g, '.')} · {trip.subtitle}
          </AppText>
        </View>
      </View>
      <Row style={{ gap: space.lg, paddingVertical: space.md }}>
        <Meta icon="footsteps-outline" text={t('trip.stopsCount', { n: trip.steps.length })} palette={palette} />
        <Meta icon="navigate-outline" text={`${trip.distanceKm} km`} palette={palette} />
        <Meta icon="people-outline" text={`${trip.members.length}`} palette={palette} />
        <View style={{ flex: 1 }} />
        <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
      </Row>
    </Pressable>
  );
}

function InlineStat({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  return (
    <Row style={{ alignItems: 'baseline', gap: 4 }}>
      {/* 数値は0から回して見せる */}
      <CountUp value={value} variant="h3" tone="ink" format={(n: number) => `${n.toLocaleString()}${suffix ?? ''}`} />
      <AppText variant="small" tone="inkFaint">{label}</AppText>
    </Row>
  );
}

function Meta({ icon, text, palette }: any) {
  return (
    <Row style={{ gap: 4 }}>
      <Ionicons name={icon} size={14} color={palette.inkFaint} />
      <AppText variant="small" tone="inkSoft">{text}</AppText>
    </Row>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.lg },
  cover: { height: 200, borderRadius: 10, overflow: 'hidden', backgroundColor: '#ddd', justifyContent: 'flex-end' },
  coverShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  coverText: { padding: space.md, gap: 2 },
  pill: { position: 'absolute', top: space.md, left: space.md, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardMenu: { position: 'absolute', top: space.sm, right: space.sm, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  menuSheet: { width: '100%', maxWidth: 360, padding: space.lg, borderRadius: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  autoRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: 12 },
  autoIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth * 2, alignItems: 'center', justifyContent: 'center' },
});
