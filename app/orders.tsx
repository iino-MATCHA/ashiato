/**
 * 注文履歴。
 * 印刷版の注文はまだ無いので、いま手元にあるもの＝旅ごとのジャーナルPDFを
 * 同じ場所に並べる。「あの旅のPDFどこだっけ」をここだけ見れば済むようにする。
 */
import { useState } from 'react';
import { View, Image, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrips, useOrders, useCart } from '@/lib/useData';
import { yen } from '@/lib/money';
import { useI18n } from '@/lib/i18n';
import { planBook, MIN_PHOTOS } from '@/lib/photobook/plan';
import { renderPdf, type RenderProgress } from '@/lib/photobook/render';
import type { Trip } from '@/lib/mock';

export default function Orders() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { trips } = useTrips();
  const { orders } = useOrders();
  const { items: cart } = useCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const mine = trips.filter((tr) => !tr.sample);

  const download = async (trip: Trip) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || busyId) return;
    setBusyId(trip.id);
    setProgress('');
    const plan = planBook(trip);
    const blob = await renderPdf(plan, ({ done, total }: RenderProgress) => setProgress(`${done}/${total}`));
    setBusyId(null);
    setProgress('');
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `my-japan-journal-${trip.id}.pdf`;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={t('settings.orders')} />
      <Rule />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>

        {/* かごに入れたまま離れた人の戻り道。空のときは出さない。 */}
        {cart.length > 0 && (
          <>
            <Pressable onPress={() => router.push('/cart' as any)}>
              <Row style={{ gap: space.md, alignItems: 'center', paddingBottom: space.md }}>
                <Ionicons name="bag-outline" size={19} color={palette.matcha} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" tone="ink">{t('cart.header')}</AppText>
                  <AppText variant="small" tone="inkFaint">
                    {cart.length} · {yen(cart.reduce((s, c) => s + c.unitPrice, 0))}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
              </Row>
            </Pressable>
            <Rule />
            <Gap h={space.lg} />
          </>
        )}

        {/* --- 手元のジャーナル --- */}
        <Eyebrow tone="matcha">{t('orders.journals')}</Eyebrow>
        <Gap h={space.sm} />
        <AppText variant="small" tone="inkFaint">{t('orders.journalsHint')}</AppText>
        <Gap h={space.md} />
        <Rule />

        {mine.length === 0 && (
          <View style={{ paddingVertical: space.xl }}>
            <AppText variant="small" tone="inkFaint" center>{t('orders.noTrips')}</AppText>
          </View>
        )}

        {mine.map((trip) => {
          const plan = planBook(trip);
          const few = plan.totalPhotos < MIN_PHOTOS;
          const busy = busyId === trip.id;
          return (
            <View key={trip.id}>
              <Row style={styles.row}>
                <Pressable onPress={() => router.push(`/trip/${trip.id}/book`)} style={styles.thumbWrap}>
                  {trip.steps[0]?.images[0] ? (
                    <Image source={{ uri: trip.steps[0].images[0] }} style={styles.thumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: palette.fill, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="book-outline" size={18} color={palette.inkFaint} />
                    </View>
                  )}
                </Pressable>
                <Pressable style={{ flex: 1 }} onPress={() => router.push(`/trip/${trip.id}/book`)}>
                  <AppText variant="bodyStrong" tone="ink" numberOfLines={1}>{trip.title}</AppText>
                  <AppText variant="small" tone="inkFaint">
                    {trip.startDate.replace(/-/g, '.')} · {plan.pages.length}p · {plan.totalPhotos} photos
                  </AppText>
                </Pressable>
                {few ? (
                  <AppText variant="small" tone="inkFaint">{plan.totalPhotos}/{MIN_PHOTOS}</AppText>
                ) : (
                  <Pressable onPress={() => download(trip)} disabled={!!busyId} hitSlop={8}>
                    <Row style={{ gap: 5, alignItems: 'center' }}>
                      <Ionicons name={busy ? 'hourglass-outline' : 'download-outline'} size={17} color={palette.matcha} />
                      <AppText variant="small" tone="matcha">{busy ? progress || '…' : 'PDF'}</AppText>
                    </Row>
                  </Pressable>
                )}
              </Row>
              <Rule />
            </View>
          );
        })}

        {/* --- 印刷版の注文 --- */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">{t('orders.printed')}</Eyebrow>
        <Gap h={space.md} />

        {orders.length === 0 ? (
          <Row style={[styles.empty, { borderColor: palette.rule }]}>
            <Ionicons name="cube-outline" size={20} color={palette.inkFaint} />
            <AppText variant="small" tone="inkFaint" style={{ flex: 1 }}>{t('orders.printedNone')}</AppText>
          </Row>
        ) : (
          <>
            <Rule />
            {orders.map((o) => (
              <Pressable key={o.id} onPress={() => router.push(`/order/${o.id}` as any)}>
                <View style={{ paddingVertical: space.md }}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <AppText variant="small" tone="inkFaint" style={{ fontSize: 11, letterSpacing: 0.8 }}>
                      {o.createdAt.slice(0, 10).replace(/-/g, '.')} · {o.id.slice(0, 8).toUpperCase()}
                    </AppText>
                    <AppText variant="small" tone={o.status === 'pending' ? 'shu' : 'matcha'}>
                      {t(`orders.status.${o.status}`)}
                    </AppText>
                  </Row>
                  <Gap h={space.sm} />
                  {o.items.map((i) => (
                    <Row key={i.id} style={{ gap: space.md, paddingVertical: 4 }}>
                      <View style={styles.orderThumbWrap}>
                        {i.coverPhotoUrl ? (
                          <Image source={{ uri: i.coverPhotoUrl }} style={styles.orderThumb} resizeMode="cover" />
                        ) : (
                          <View style={[styles.orderThumb, { backgroundColor: palette.fill }]} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="small" tone="ink" numberOfLines={1}>{i.title}</AppText>
                        <AppText variant="small" tone="inkFaint" style={{ fontSize: 11 }}>
                          {t(i.plan === 'premium' ? 'bind.premiumName' : 'bind.regularName')} · {i.pageCount} {t('cart.pages')}
                        </AppText>
                      </View>
                    </Row>
                  ))}
                  <Gap h={space.sm} />
                  <Row style={{ justifyContent: 'flex-end' }}>
                    <AppText variant="small" tone="inkSoft">{yen(o.amount)}</AppText>
                  </Row>
                </View>
                <Rule />
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.md, alignItems: 'center', paddingVertical: space.md },
  thumbWrap: { borderRadius: 8, overflow: 'hidden' },
  thumb: { width: 52, height: 52, borderRadius: 8 },
  empty: { gap: space.sm, alignItems: 'center', borderWidth: hairline, borderStyle: 'dashed', borderRadius: 10, padding: space.md },
  orderThumbWrap: { borderRadius: 3, overflow: 'hidden' },
  orderThumb: { width: 30, height: 42, borderRadius: 3 },
});
