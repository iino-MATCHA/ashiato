/**
 * 製本の選択画面。/trip の本アイコンから開く。
 *
 * 決済はまだ繋いでいないので、
 *   プレビュー → この一冊の説明 → プラン比較 → 送料の注記 → 仮予約
 * までを作り、需要（メールアドレスと配送先）だけ集める。
 * 既存のジャーナルPDF（/trip/[id]/book）は残し、一番下から見本として辿れる。
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Image, Pressable, ScrollView, StyleSheet, Modal, TextInput,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { WashiBackground } from '@/components/WashiBackground';
import { space, fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrip } from '@/lib/useData';
import { useI18n } from '@/lib/i18n';
import { planBook } from '@/lib/photobook/plan';
import { renderPage, PAGE_SIZE } from '@/lib/photobook/render';
import { BookPreview } from '@/components/BookPreview';

export default function TripBind() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip } = useTrip(id);

  const [chosen, setChosen] = useState<'premium' | 'regular' | null>(null);
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState<'jp' | 'overseas'>('jp');
  const [sent, setSent] = useState(false);
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

  const openPlan = (p: 'premium' | 'regular') => { setSent(false); setChosen(p); };

  const submit = () => {
    // 決済が繋がるまでは、需要の記録として控えるだけ（送信先は未接続）
    if (!email.trim()) return;
    setSent(true);
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

        <Gap h={space.xs} />
        <AppText variant="small" tone="inkFaint" center style={{ fontSize: 11 }}>
          {t('bind.previewHint')}
        </AppText>

        {/* ② この一冊について ------------------------------------------ */}
        <View style={{ paddingHorizontal: space.lg }}>
          <Gap h={space.xl} />
          <View style={[styles.about, { borderColor: palette.rule }]}>
            <WashiBackground />
            <View style={{ padding: space.lg }}>
              <Row style={{ gap: 8, alignItems: 'center' }}>
                <Ionicons name="book-outline" size={17} color={palette.shu} />
                <AppText variant="bodyStrong" tone="ink">{t('bind.aboutTitle')}</AppText>
              </Row>
              <Gap h={space.sm} />
              <AppText variant="small" tone="inkSoft" style={{ lineHeight: 23 }}>
                {t('bind.aboutBody')}
              </AppText>
            </View>
          </View>

          {/* ③ プラン ------------------------------------------------- */}
          <Gap h={space.xl} />
          <Eyebrow tone="matcha">{t('bind.plansEyebrow')}</Eyebrow>
          <Gap h={space.md} />

          <PlanCard
            tier={t('bind.premiumTier')}
            name={t('bind.premiumName')}
            price="8,500"
            badges={[t('bind.badgePopular'), t('bind.badgeCraft')]}
            features={[t('bind.premiumF1'), t('bind.premiumF2'), t('bind.premiumF3')]}
            accent
            palette={palette}
            t={t}
            onPress={() => openPlan('premium')}
          />
          <Gap h={space.md} />
          <PlanCard
            tier={t('bind.regularTier')}
            name={t('bind.regularName')}
            price="3,900"
            badges={[]}
            features={[t('bind.regularF1'), t('bind.regularF2'), t('bind.regularF3')]}
            palette={palette}
            t={t}
            onPress={() => openPlan('regular')}
          />

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

      {/* ⑤ 仮予約 ---------------------------------------------------- */}
      <Modal visible={chosen !== null} transparent animationType="fade" onRequestClose={() => setChosen(null)}>
        <Pressable style={styles.backdrop} onPress={() => setChosen(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: palette.washi }]} onPress={() => {}}>
            {sent ? (
              <View style={{ alignItems: 'center', paddingVertical: space.lg }}>
                <Ionicons name="checkmark-circle" size={38} color={palette.matcha} />
                <Gap h={space.sm} />
                <AppText variant="h3" tone="ink" center>{t('bind.thanks')}</AppText>
                <Gap h={space.lg} />
                <Button label={t('common.close')} tone="matcha" onPress={() => setChosen(null)} />
              </View>
            ) : (
              <>
                <AppText variant="h3" tone="ink">{t('bind.modalTitle')}</AppText>
                <Gap h={space.xs} />
                <AppText variant="small" tone="inkSoft" style={{ lineHeight: 21 }}>{t('bind.modalBody')}</AppText>

                <Gap h={space.lg} />
                <AppText variant="small" tone="inkSoft">{t('bind.email')}</AppText>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={palette.inkFaint}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, { color: palette.ink }]}
                />
                <Rule strong />

                <Gap h={space.lg} />
                <AppText variant="small" tone="inkSoft">{t('bind.country')}</AppText>
                <Gap h={space.sm} />
                <Row style={{ gap: space.sm }}>
                  {([['jp', t('bind.countryJp')], ['overseas', t('bind.countryOverseas')]] as const).map(([k, label]) => {
                    const on = country === k;
                    return (
                      <Pressable
                        key={k}
                        onPress={() => setCountry(k as 'jp' | 'overseas')}
                        style={[styles.segment, { borderColor: on ? palette.matcha : palette.ruleStrong }, on && { backgroundColor: palette.matcha }]}
                      >
                        <AppText variant="small" style={{ color: on ? '#fff' : palette.inkSoft }}>{label}</AppText>
                      </Pressable>
                    );
                  })}
                </Row>

                <Gap h={space.lg} />
                <Button label={t('bind.notifyMe')} tone="matcha" onPress={submit} disabled={!email.trim()} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function PlanCard({ tier, name, price, badges, features, accent, palette, t, onPress }: any) {
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
        <Button label={t('bind.cta')} tone={accent ? 'matcha' : 'ink'} variant={accent ? undefined : 'outline'} onPress={onPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 谷折りの陰
  about: { borderWidth: hairline, borderRadius: 14, overflow: 'hidden' },
  plan: { borderWidth: hairline * 2, borderRadius: 16, overflow: 'hidden' },
  planEdge: { height: 4, width: '100%' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  sampleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  sampleIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  sheet: { width: '100%', maxWidth: 380, borderRadius: 16, padding: space.lg },
  input: { fontFamily: fonts.minchoMedium, fontSize: 17, paddingVertical: space.sm },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 999, borderWidth: hairline * 2 },
});
