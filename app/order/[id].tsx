/**
 * ③ ご購入ありがとうございました。
 *
 * 決済のあとはここ以外に行き先を作らない（戻るで決済画面に帰らせない）。
 * 出口はふたつだけ ―― 地図へ戻るか、注文履歴を見るか。
 */
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Rule, Gap, Button } from '@/components/ui';
import { CheckoutSteps } from '@/components/CheckoutSteps';
import { WashiBackground } from '@/components/WashiBackground';
import { space, fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useOrders } from '@/lib/useData';
import { useI18n } from '@/lib/i18n';
import { yen } from '@/lib/money';

export default function OrderDone() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders } = useOrders();

  const order = orders.find((o) => o.id === id) ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
        <Gap h={space.sm} />
        <CheckoutSteps at={3} />

        {/* 御朱印の朱は使わない。完了は matcha で締める */}
        <Gap h={space.xxl} />
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={54} color={palette.matcha} />
          <Gap h={space.lg} />
          <AppText variant="h2" tone="ink" center>{t('done.title')}</AppText>
          <Gap h={space.md} />
          <AppText variant="small" tone="inkSoft" center style={{ lineHeight: 23, maxWidth: 340 }}>
            {t('done.body')}
          </AppText>
        </View>

        {/* 注文の控え */}
        <Gap h={space.xxl} />
        <View style={[styles.receipt, { borderColor: palette.rule }]}>
          <WashiBackground />
          <View style={{ padding: space.lg }}>
            <AppText variant="small" tone="inkFaint" style={{ fontSize: 11, letterSpacing: 1 }}>
              {t('done.orderNo').toUpperCase()}
            </AppText>
            <Gap h={4} />
            <AppText style={{ fontFamily: fonts.minchoMedium, fontSize: 15, color: palette.ink, letterSpacing: 0.5 }}>
              {String(id ?? '').slice(0, 8).toUpperCase()}
            </AppText>

            {order && (
              <>
                <Gap h={space.md} />
                <Rule />
                {order.items.map((i) => (
                  <Row key={i.id} style={{ gap: space.md, paddingVertical: space.sm }}>
                    <View style={[styles.cover, { backgroundColor: palette.fill, borderColor: palette.rule }]}>
                      {i.coverPhotoUrl ? (
                        <Image source={{ uri: i.coverPhotoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      ) : (
                        <Ionicons name="book-outline" size={14} color={palette.inkFaint} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="small" tone="ink" numberOfLines={1}>{i.title}</AppText>
                      <AppText variant="small" tone="inkFaint" style={{ fontSize: 11 }}>
                        {t(i.plan === 'premium' ? 'bind.premiumName' : 'bind.regularName')} · {i.pageCount} {t('cart.pages')}
                      </AppText>
                    </View>
                    <AppText variant="small" tone="inkSoft">{yen(i.unitPrice)}</AppText>
                  </Row>
                ))}
                <Rule />

                <Gap h={space.md} />
                <Row style={{ justifyContent: 'space-between' }}>
                  <AppText variant="small" tone="inkSoft">{t('checkout.shipping')}</AppText>
                  <AppText variant="small" tone={order.shippingFee === 0 ? 'matcha' : 'ink'}>
                    {order.shippingFee === 0 ? t('checkout.free') : yen(order.shippingFee)}
                  </AppText>
                </Row>
                <Gap h={space.sm} />
                <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <AppText variant="bodyStrong" tone="ink">{t('checkout.total')}</AppText>
                  <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 24, color: palette.ink }}>
                    {yen(order.amount)}
                  </AppText>
                </Row>
                <Gap h={space.sm} />
                <AppText variant="small" tone="inkFaint" style={{ fontSize: 11 }}>
                  {t(`orders.status.${order.status}`)}
                </AppText>
              </>
            )}
          </View>
        </View>

        <Gap h={space.xxl} />
        <Button label={t('done.backHome')} tone="matcha" onPress={() => router.replace('/(tabs)/map')} />
        <Gap h={space.md} />
        <Button label={t('done.seeOrders')} tone="ink" variant="outline" onPress={() => router.replace('/orders' as any)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  receipt: { borderWidth: hairline, borderRadius: 14, overflow: 'hidden' },
  cover: {
    width: 34, height: 48, borderRadius: 3, borderWidth: hairline, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
});
