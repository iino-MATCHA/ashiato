/**
 * 製本の選択画面。/trip の本アイコンから開く。
 *
 *   プレビュー → この一冊の説明 → プラン比較 → 送料の注記 → かごへ
 *
 * 「かごに入れる」を押した時点で全ページを焼いて保存する（lib/api の addToCart）。
 * 少し待たせるが、そのぶん注文の中身はここで確定し、あとから旅を編集されても
 * 届く本は変わらない。
 * 既存のジャーナルPDF（/trip/[id]/book）は残し、一番下から見本として辿れる。
 */
import { track } from '@/lib/analytics';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Pressable, ScrollView, StyleSheet, Modal,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { space, fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrip, useCart } from '@/lib/useData';
import { useI18n } from '@/lib/i18n';
import { planBook, MIN_PHOTOS } from '@/lib/photobook/plan';
import { renderPage, PAGE_SIZE } from '@/lib/photobook/render';
import { BookPreview } from '@/components/BookPreview';
import { addToCart, PLAN_PRICE, type BookPlanKey } from '@/lib/api';

export default function TripBind() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip } = useTrip(id);
  const { items: cart } = useCart();

  // ページを焼いている間の進捗。null なら何もしていない。
  const [adding, setAdding] = useState<{ plan: BookPlanKey; done: number; total: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  // プレビューは実際のPDFのページをそのまま使う（見本と本番で見え方を変えない）。
  // 最初に全ページを描くと重いので、BookPreview から求められた分だけ描く。
  const book = useMemo(() => (trip ? planBook(trip) : null), [trip]);
  const cache = useRef(new Map<number, string | null>());
  const getPage = useCallback(
    async (i: number) => {
      if (!book) return null;
      const hit = cache.current.get(i);
      if (hit !== undefined) return hit;
      const url = await renderPage(book, i);
      cache.current.set(i, url);
      return url;
    },
    [book]
  );

  const bookW = Math.min(width - space.lg * 2, 460);

  if (!trip || !book) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">{t('common.loading')}</AppText>
      </SafeAreaView>
    );
  }

  const inCart = cart.find((c) => c.tripId === trip.id) ?? null;
  const tooFewPhotos = book.totalPhotos < MIN_PHOTOS;

  const add = async (plan: BookPlanKey) => {
    if (adding || tooFewPhotos) return;
    setFailed(false);
    setAdding({ plan, done: 0, total: book.pages.length });
    try {
      track('add_to_cart');
      const item = await addToCart({
        tripId: trip.id,
        plan,
        title: trip.title,
        photoCount: book.totalPhotos,
        pageCount: book.pages.length,
        renderPage: getPage,
        onProgress: (done, total) => setAdding({ plan, done, total }),
      });
      setAdding(null);
      if (!item) { setFailed(true); return; }
      router.push('/cart' as any);
    } catch {
      setAdding(null);
      setFailed(true);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={t('bind.header')} />
      <Rule />
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>

        {/* ① プレビュー ------------------------------------------------ */}
        <View style={{ paddingHorizontal: space.lg }}>
          <Gap h={space.lg} />
          <Eyebrow tone="matcha">{t('bind.previewEyebrow')}</Eyebrow>
          <Gap h={space.md} />
        </View>

        <View style={{ alignItems: 'center' }}>
          <BookPreview
            total={book.pages.length}
            getPage={getPage}
            width={bookW}
            ratio={PAGE_SIZE.height / PAGE_SIZE.width}
          />
        </View>


        {/* ② この一冊について ------------------------------------------ */}
        <View style={{ paddingHorizontal: space.lg }}>
          {/* 説明は箱で囲わない。細い罫だけで区切る */}
          <Gap h={space.xl} />
          <Rule />
          <Gap h={space.lg} />
          <Row style={{ gap: 8, alignItems: 'center' }}>
            <Ionicons name="book-outline" size={17} color={palette.shu} />
            <AppText variant="bodyStrong" tone="ink">{t('bind.aboutTitle')}</AppText>
          </Row>
          <Gap h={space.sm} />
          <AppText variant="small" tone="inkSoft" style={{ lineHeight: 23 }}>
            {t('bind.aboutBody')}
          </AppText>
          <Gap h={space.lg} />
          <Rule />

          {/* ③ プラン ------------------------------------------------- */}
          <Gap h={space.xl} />
          <Eyebrow tone="matcha">{t('bind.plansEyebrow')}</Eyebrow>
          <Gap h={space.md} />

          <PlanCard
            tier={t('bind.premiumTier')}
            name={t('bind.premiumName')}
            price={PLAN_PRICE.premium.toLocaleString('en-US')}
            badges={[t('bind.badgePopular'), t('bind.badgeCraft')]}
            features={[t('bind.premiumF1'), t('bind.premiumF2'), t('bind.premiumF3')]}
            accent
            palette={palette}
            t={t}
            inCart={inCart?.plan === 'premium'}
            disabled={tooFewPhotos || !!adding}
            onPress={() => (inCart?.plan === 'premium' ? router.push('/cart' as any) : add('premium'))}
          />
          <Gap h={space.md} />
          <PlanCard
            tier={t('bind.regularTier')}
            name={t('bind.regularName')}
            price={PLAN_PRICE.regular.toLocaleString('en-US')}
            badges={[]}
            features={[t('bind.regularF1'), t('bind.regularF2'), t('bind.regularF3')]}
            palette={palette}
            t={t}
            inCart={inCart?.plan === 'regular'}
            disabled={tooFewPhotos || !!adding}
            onPress={() => (inCart?.plan === 'regular' ? router.push('/cart' as any) : add('regular'))}
          />

          {tooFewPhotos && (
            <>
              <Gap h={space.md} />
              <AppText variant="small" tone="shu">
                {t('bind.needPhotos')}（{book.totalPhotos}/{MIN_PHOTOS}）
              </AppText>
            </>
          )}
          {failed && (
            <>
              <Gap h={space.md} />
              <AppText variant="small" tone="shu">{t('bind.addFailed')}</AppText>
            </>
          )}

          {/* ④ 送料の注記 --------------------------------------------- */}
          <Gap h={space.lg} />
          {[t('bind.shipNote1'), t('bind.shipNote2')].map((n) => (
            <Row key={n} style={{ gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
              <AppText variant="small" tone="inkFaint">※</AppText>
              <AppText variant="small" tone="inkFaint" style={{ flex: 1, lineHeight: 19 }}>{n}</AppText>
            </Row>
          ))}

          {/* 見本（既存のジャーナル） ---------------------------------- */}
          <Gap h={space.xl} />
          <Rule />
          <Pressable
            onPress={() => router.push(`/trip/${trip.id}/book`)}
            style={({ pressed }) => [styles.sampleRow, pressed && { opacity: 0.6 }]}
          >
            <View style={[styles.sampleIcon, { backgroundColor: palette.fill }]}>
              <Ionicons name="document-text-outline" size={19} color={palette.matcha} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" tone="ink">{t('bind.seeSample')}</AppText>
              <AppText variant="small" tone="inkFaint">{t('bind.seeSampleSub')}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
          </Pressable>
          <Rule />
        </View>
      </ScrollView>

      {/* ⑤ かごへ入れている間 ------------------------------------------
          全ページを焼いて保存するので数秒かかる。何をしているのかと
          どこまで進んだのかを出して、戻る操作を塞ぐ。 */}
      {/* visible={false} でも中身がDOMに残り、製本ページへ戻ったときに
          「0 / 0」の幕が被る。焼いている間だけ組み立てる。 */}
      {adding !== null && (
      <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: palette.washi, alignItems: 'center' }]}>
            <Ionicons name="book-outline" size={30} color={palette.matcha} />
            <Gap h={space.md} />
            <AppText variant="h3" tone="ink" center>{t('bind.preparing')}</AppText>
            <Gap h={space.md} />
            <View style={[styles.bar, { backgroundColor: palette.rule }]}>
              <View
                style={{
                  height: '100%',
                  borderRadius: 999,
                  backgroundColor: palette.matcha,
                  width: `${Math.round((adding.done / Math.max(1, adding.total)) * 100)}%`,
                }}
              />
            </View>
            <Gap h={space.sm} />
            <AppText variant="small" tone="inkFaint">{adding.done} / {adding.total}</AppText>
          </View>
        </View>
      </Modal>
      )}
    </SafeAreaView>
  );
}

function PlanCard({ tier, name, price, badges, features, accent, palette, t, onPress, inCart, disabled }: any) {
  return (
    <View style={[styles.plan, { borderColor: accent ? palette.matcha : palette.rule, backgroundColor: palette.paper }]}>
      {accent && <View style={[styles.planEdge, { backgroundColor: palette.matcha }]} />}
      <View style={{ padding: space.lg }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <AppText variant="eyebrow" tone={accent ? 'matcha' : 'inkFaint'}>{tier}</AppText>
          <Row style={{ gap: 5 }}>
            {badges.map((b: string) => (
              <View key={b} style={[styles.badge, { backgroundColor: palette.fill }]}>
                <AppText variant="small" tone="inkSoft" style={{ fontSize: 10 }}>{b}</AppText>
              </View>
            ))}
          </Row>
        </Row>
        <Gap h={6} />
        <AppText variant="h3" tone="ink">{name}</AppText>

        <Gap h={space.sm} />
        <Row style={{ alignItems: 'baseline', gap: 5 }}>
          <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 30, color: palette.ink }}>¥{price}</AppText>
          <AppText variant="small" tone="inkFaint">{t('bind.taxIncl')}</AppText>
          <AppText variant="small" tone="inkFaint">· {t('bind.shippingExtra')}</AppText>
        </Row>

        <Gap h={space.md} />
        {features.map((f: string) => (
          <Row key={f} style={{ gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
            <Ionicons name="checkmark" size={15} color={palette.matcha} style={{ marginTop: 2 }} />
            <AppText variant="small" tone="inkSoft" style={{ flex: 1, lineHeight: 20 }}>{f}</AppText>
          </Row>
        ))}

        <Gap h={space.md} />
        {inCart && (
          <>
            <Row style={{ gap: 6, alignItems: 'center', paddingBottom: space.sm }}>
              <Ionicons name="checkmark-circle" size={15} color={palette.matcha} />
              <AppText variant="small" tone="matcha">{t('bind.inCart')}</AppText>
            </Row>
          </>
        )}
        <Button
          label={inCart ? t('bind.goToCart') : t('bind.addToCart')}
          tone={accent || inCart ? 'matcha' : 'ink'}
          variant={accent || inCart ? undefined : 'outline'}
          disabled={disabled}
          onPress={onPress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plan: { borderWidth: hairline * 2, borderRadius: 16, overflow: 'hidden' },
  planEdge: { height: 4, width: '100%' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  sampleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  sampleIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  sheet: { width: '100%', maxWidth: 380, borderRadius: 16, padding: space.lg },
  bar: { width: '100%', height: 4, borderRadius: 999, overflow: 'hidden' },
});
