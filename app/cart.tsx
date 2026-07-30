/**
 * ① 注文かご。製本ページからここへ来る。
 *
 * 並ぶのは「かごに入れた時点で焼き付けた本」なので、旅を後から編集しても
 * ここの中身は動かない。表紙は焼いた1ページ目をそのまま出す（見本と実物を
 * 別のものにしない）。冊数は増やせず、削除だけできる。
 */
import { useState } from 'react';
import { View, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Button } from '@/components/ui';
import { CheckoutSteps } from '@/components/CheckoutSteps';
import { space, fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useCart } from '@/lib/useData';
import { useI18n } from '@/lib/i18n';
import { removeCartItem, setCartQty } from '@/lib/api';
import { yen } from '@/lib/money';

export default function Cart() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { items, loading } = useCart();
  const [confirming, setConfirming] = useState<string | null>(null);

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  const remove = async (id: string) => {
    setConfirming(null);
    await removeCartItem(id); // bump('cart') で一覧が即座に描き直る
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={t('cart.header')} />
      <Rule />

      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
        <CheckoutSteps at={1} />
        <Gap h={space.lg} />
        <AppText variant="h2" tone="ink">{t('cart.title')}</AppText>
        <Gap h={space.sm} />
        <AppText variant="small" tone="inkFaint" style={{ lineHeight: 20 }}>{t('cart.lead')}</AppText>

        <Gap h={space.lg} />
        <Rule />

        {loading && (
          <View style={{ paddingVertical: space.xl }}>
            <AppText variant="small" tone="inkFaint" center>{t('common.loading')}</AppText>
          </View>
        )}

        {!loading && items.length === 0 && (
          <View style={{ paddingVertical: space.xxl, alignItems: 'center' }}>
            <Ionicons name="bag-outline" size={34} color={palette.inkFaint} />
            <Gap h={space.md} />
            <AppText variant="small" tone="inkFaint">{t('cart.empty')}</AppText>
            <Gap h={space.lg} />
            <Pressable onPress={() => router.replace('/(tabs)/map')} hitSlop={8}>
              <AppText variant="small" tone="matcha">{t('cart.emptyCta')} →</AppText>
            </Pressable>
          </View>
        )}

        {items.map((item) => (
          <View key={item.id}>
            <Row style={styles.row}>
              <View style={[styles.cover, { backgroundColor: palette.fill, borderColor: palette.rule }]}>
                {item.coverPhotoUrl ? (
                  <Image source={{ uri: item.coverPhotoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <Ionicons name="book-outline" size={18} color={palette.inkFaint} />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" tone="ink" numberOfLines={2}>{item.title}</AppText>
                <Gap h={4} />
                <AppText variant="small" tone="inkFaint">
                  {t(item.plan === 'premium' ? 'bind.premiumName' : 'bind.regularName')} · {item.pageCount} {t('cart.pages')}
                </AppText>
                <Gap h={space.sm} />
                {/* 部数。押せるものなので丸で囲う（説明文は囲わない方針のまま） */}
                <Row style={{ gap: space.sm, alignItems: 'center' }}>
                  <Pressable
                    onPress={() => setCartQty(item.id, item.qty - 1)}
                    disabled={item.qty <= 1}
                    hitSlop={8}
                    style={[styles.step, { borderColor: palette.ruleStrong }, item.qty <= 1 && { opacity: 0.35 }]}
                  >
                    <Ionicons name="remove" size={15} color={palette.ink} />
                  </Pressable>
                  <AppText variant="bodyStrong" tone="ink" style={{ minWidth: 22, textAlign: 'center' }}>{item.qty}</AppText>
                  <Pressable
                    onPress={() => setCartQty(item.id, item.qty + 1)}
                    disabled={item.qty >= 20}
                    hitSlop={8}
                    style={[styles.step, { borderColor: palette.ruleStrong }, item.qty >= 20 && { opacity: 0.35 }]}
                  >
                    <Ionicons name="add" size={15} color={palette.ink} />
                  </Pressable>
                  <AppText variant="small" tone="inkFaint">{t('cart.copies')}</AppText>
                </Row>
                <Gap h={space.sm} />
                {confirming === item.id ? (
                  <Row style={{ gap: space.md }}>
                    <Pressable onPress={() => remove(item.id)} hitSlop={8}>
                      <AppText variant="small" tone="shu">{t('cart.remove')}</AppText>
                    </Pressable>
                    <Pressable onPress={() => setConfirming(null)} hitSlop={8}>
                      <AppText variant="small" tone="inkFaint">{t('common.close')}</AppText>
                    </Pressable>
                  </Row>
                ) : (
                  <Pressable onPress={() => setConfirming(item.id)} hitSlop={8}>
                    <Row style={{ gap: 5, alignItems: 'center' }}>
                      <Ionicons name="trash-outline" size={14} color={palette.inkFaint} />
                      <AppText variant="small" tone="inkFaint">{t('cart.remove')}</AppText>
                    </Row>
                  </Pressable>
                )}
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 17, color: palette.ink }}>
                  {yen(item.unitPrice * item.qty)}
                </AppText>
                {item.qty > 1 && (
                  <AppText variant="small" tone="inkFaint">{yen(item.unitPrice)} × {item.qty}</AppText>
                )}
              </View>
            </Row>
            {confirming === item.id && (
              <AppText variant="small" tone="shu" style={{ paddingBottom: space.sm }}>
                {t('cart.removeConfirm')}
              </AppText>
            )}
            <Rule />
          </View>
        ))}

        {items.length > 0 && (
          <>
            <Gap h={space.lg} />
            <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <AppText variant="small" tone="inkSoft">{t('cart.subtotal')}</AppText>
              <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 26, color: palette.ink }}>
                {yen(subtotal)}
              </AppText>
            </Row>
            <Gap h={space.sm} />
            <AppText variant="small" tone="inkFaint" style={{ lineHeight: 19 }}>{t('cart.shippingNext')}</AppText>

            <Gap h={space.xl} />
            <Button label={t('cart.toCheckout')} tone="matcha" onPress={() => router.push('/checkout' as any)} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  step: { width: 30, height: 30, borderRadius: 15, borderWidth: hairline * 2, alignItems: 'center', justifyContent: 'center' },
  row: { gap: space.md, alignItems: 'flex-start', paddingVertical: space.md },
  cover: {
    width: 56, height: 79, borderRadius: 4, borderWidth: hairline, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
});
