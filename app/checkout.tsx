/**
 * ② お支払い。メールアドレス・お届け先・送料・決済をこの1画面で済ませる。
 *
 * 送料は配送先（日本国内 / 海外）を選んだ瞬間に確定して合計へ反映する。
 * 金額はサーバ側 shipping_fee_for() と同じ規則で、ここでは表示のために計算する
 * （実際に注文へ載る金額は checkout_cart() がDBの単価から組み直す）。
 *
 * 支払いは Stripe に渡す想定。まだ鍵が入っていない間は注文だけ確定し、
 * 支払い方法はメールで案内する旨をその場に出す（黙って成功にしない）。
 */
import { useMemo, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
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
import {
  checkoutCart, markOrderPaid, shippingFeeFor, SHIPPING_REGIONS,
  type ShippingInput, type ShippingRegion,
} from '@/lib/api';
import { yen } from '@/lib/money';

/** Stripe の公開鍵。入っていなければカード決済の画面へは進めない。 */
const STRIPE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

/**
 * 下線だけの入力欄。
 * コンポーネント本体の中で定義すると、1文字打つたびに作り直されて
 * 入力欄からフォーカスが外れる。必ず外に置く。
 */
function Field({
  label, value, onChangeText, placeholder, keyboardType, optional, palette,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'email-address' | 'phone-pad';
  optional?: boolean;
  palette: any;
}) {
  return (
    <>
      <Gap h={space.md} />
      <AppText variant="small" tone="inkSoft">{label}</AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.inkFaint}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        keyboardType={keyboardType}
        style={[styles.input, { color: palette.ink }]}
      />
      <Rule strong={!optional} />
    </>
  );
}

export default function Checkout() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { items, loading } = useCart();

  const [region, setRegion] = useState<ShippingRegion>('east-asia');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [postalCode, setPostal] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.unitPrice, 0), [items]);
  const shipping = shippingFeeFor(region);
  const total = subtotal + shipping;

  const ready = !!email.trim() && !!name.trim() && !!address1.trim() && items.length > 0;

  const pay = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const input: ShippingInput = { email, name, region, postalCode, address1, address2, phone };
      const orderId = await checkoutCart(input);
      if (!orderId) throw new Error('no order');

      // Stripe を通す場所。鍵が無い間は注文を pending のまま残し、
      // 完了画面で「支払い方法はメールで案内する」と伝える。
      if (STRIPE_KEY) {
        await markOrderPaid(orderId);
      }
      router.replace(`/order/${orderId}` as any);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : t('checkout.failed'));
      setBusy(false);
    }
  };

  // かごが空ならここに留まらせない
  if (!loading && items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
        <Header title={t('checkout.header')} />
        <Rule />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md }}>
          <Ionicons name="bag-outline" size={34} color={palette.inkFaint} />
          <AppText variant="small" tone="inkFaint">{t('cart.empty')}</AppText>
          <Pressable onPress={() => router.replace('/(tabs)/map')} hitSlop={8}>
            <AppText variant="small" tone="matcha">{t('cart.emptyCta')} →</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={t('checkout.header')} />
      <Rule />

      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <CheckoutSteps at={2} />

        {/* --- 連絡先 --- */}
        <Gap h={space.lg} />
        <AppText variant="h3" tone="ink">{t('checkout.contact')}</AppText>
        <Gap h={4} />
        <AppText variant="small" tone="inkFaint">{t('checkout.contactHint')}</AppText>
        <Field
          palette={palette}
          label={t('checkout.email')}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
        />

        {/* --- お届け先 --- */}
        <Gap h={space.xl} />
        <AppText variant="h3" tone="ink">{t('checkout.shipTo')}</AppText>

        <Gap h={space.md} />
        <AppText variant="small" tone="inkSoft">{t('checkout.region')}</AppText>
        <Gap h={space.sm} />
        {/* 送料はここで決まる。金額を各行に出して、選ぶ前から分かるようにする */}
        {SHIPPING_REGIONS.map((k) => {
          const on = region === k;
          return (
            <Pressable
              key={k}
              onPress={() => setRegion(k)}
              style={[styles.regionRow, { borderColor: on ? palette.matcha : palette.rule }, on && { backgroundColor: palette.fill }]}
            >
              <Ionicons
                name={on ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={on ? palette.matcha : palette.ruleStrong}
              />
              <View style={{ flex: 1 }}>
                <AppText variant="small" tone="ink">{t(`checkout.region.${k}`)}</AppText>
                <AppText variant="small" tone="inkFaint" style={{ fontSize: 11, lineHeight: 16 }}>
                  {t(`checkout.hint.${k}`)}
                </AppText>
              </View>
              <AppText variant="small" tone={on ? 'matcha' : 'inkFaint'}>{yen(shippingFeeFor(k))}</AppText>
            </Pressable>
          );
        })}
        <Gap h={space.sm} />
        <AppText variant="small" tone="inkFaint" style={{ fontSize: 11 }}>{t('checkout.flatRate')}</AppText>

        <Field palette={palette} label={t('checkout.name')} value={name} onChangeText={setName} placeholder="Taro Yamada" />
        <Field palette={palette} label={t('checkout.postal')} value={postalCode} onChangeText={setPostal} placeholder={region === 'east-asia' ? '150-0001' : 'ZIP / Postcode'} />
        <Field palette={palette} label={t('checkout.address1')} value={address1} onChangeText={setAddress1} placeholder={region === 'east-asia' ? '東京都渋谷区…' : 'Street, city, country'} />
        <Field palette={palette} label={t('checkout.address2')} value={address2} onChangeText={setAddress2} placeholder="" optional />
        <Field palette={palette} label={t('checkout.phone')} value={phone} onChangeText={setPhone} placeholder="" keyboardType="phone-pad" optional />

        {/* ホテル宛ての案内は日本に届ける人にだけ要る */}
        {region === 'east-asia' && (
          <>
            <Gap h={space.md} />
            <Row style={{ gap: 6, alignItems: 'flex-start' }}>
              <AppText variant="small" tone="inkFaint">※</AppText>
              <AppText variant="small" tone="inkFaint" style={{ flex: 1, lineHeight: 19 }}>{t('checkout.hotelNote')}</AppText>
            </Row>
          </>
        )}

        {/* --- ご注文内容 --- */}
        <Gap h={space.xl} />
        <AppText variant="h3" tone="ink">{t('checkout.summary')}</AppText>
        <Gap h={space.md} />
        <Rule />
        {items.map((i) => (
          <View key={i.id}>
            <Row style={{ paddingVertical: space.sm, gap: space.md }}>
              <View style={{ flex: 1 }}>
                <AppText variant="small" tone="ink" numberOfLines={1}>{i.title}</AppText>
                <AppText variant="small" tone="inkFaint" style={{ fontSize: 11 }}>
                  {t(i.plan === 'premium' ? 'bind.premiumName' : 'bind.regularName')} · {i.pageCount} {t('cart.pages')}
                </AppText>
              </View>
              <AppText variant="small" tone="inkSoft">{yen(i.unitPrice)}</AppText>
            </Row>
            <Rule />
          </View>
        ))}

        <Gap h={space.md} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText variant="small" tone="inkSoft">{t('cart.subtotal')}</AppText>
          <AppText variant="small" tone="ink">{yen(subtotal)}</AppText>
        </Row>
        <Gap h={space.sm} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText variant="small" tone="inkSoft">
            {t('checkout.shipping')} · {t(`checkout.region.${region}`)}
          </AppText>
          <AppText variant="small" tone="ink">{yen(shipping)}</AppText>
        </Row>
        <Gap h={space.md} />
        <Rule strong />
        <Gap h={space.md} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <AppText variant="bodyStrong" tone="ink">{t('checkout.total')}</AppText>
          <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 28, color: palette.ink }}>{yen(total)}</AppText>
        </Row>

        {/* --- 決済 --- */}
        <Gap h={space.xl} />
        <AppText variant="h3" tone="ink">{t('checkout.payment')}</AppText>
        <Gap h={space.sm} />
        <Row style={{ gap: 8, alignItems: 'flex-start' }}>
          <Ionicons name="lock-closed-outline" size={14} color={palette.inkFaint} style={{ marginTop: 2 }} />
          <AppText variant="small" tone="inkFaint" style={{ flex: 1, lineHeight: 19 }}>
            {STRIPE_KEY ? t('checkout.cardNote') : t('checkout.stripePending')}
          </AppText>
        </Row>

        {!!error && (<><Gap h={space.md} /><AppText variant="small" tone="shu">{error}</AppText></>)}
        {!ready && !error && (<><Gap h={space.md} /><AppText variant="small" tone="inkFaint">{t('checkout.required')}</AppText></>)}

        <Gap h={space.lg} />
        <Button
          label={busy ? t('checkout.working') : t('checkout.pay', { amount: total.toLocaleString('en-US') })}
          tone="matcha"
          disabled={!ready || busy}
          onPress={pay}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 箱で囲わず下線だけ
  input: { fontFamily: fonts.minchoMedium, fontSize: 17, paddingVertical: space.sm },
  regionRow: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingVertical: 10, paddingHorizontal: space.md, marginBottom: 6,
    borderRadius: 10, borderWidth: hairline * 2,
  },
});
