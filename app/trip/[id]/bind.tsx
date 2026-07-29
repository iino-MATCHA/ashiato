/**
 * 製本の選択画面。/trip の本アイコンから開く。
 *
 * 決済はまだ繋いでいないので、
 *   プレビュー → この一冊の説明 → プラン比較 → 送料の注記 → 仮予約
 * までを作り、需要（メールアドレスと配送先）だけ集める。
 * 既存のジャーナルPDF（/trip/[id]/book）は残し、一番下から見本として辿れる。
 */
import { useRef, useState } from 'react';
import {
  View, Image, Pressable, ScrollView, StyleSheet, Modal, TextInput,
  useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { Stamp } from '@/components/Stamp';
import { WashiBackground } from '@/components/WashiBackground';
import { space, fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrip } from '@/lib/useData';
import { useI18n } from '@/lib/i18n';
import { PREFECTURE_ID_BY_SLUG, PREFECTURE_KANJI_BY_ID, slugForName } from '@/lib/prefectures';

export default function TripBind() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip } = useTrip(id);

  const [spread, setSpread] = useState(0);
  const [plan, setPlan] = useState<'premium' | 'regular' | null>(null);
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState<'jp' | 'overseas'>('jp');
  const [sent, setSent] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  if (!trip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">{t('common.loading')}</AppText>
      </SafeAreaView>
    );
  }

  // 見開きは「左に写真、右は奉書紙の白紙（御朱印をもらう面）」の組で作る
  const photos = trip.steps.map((s) => s.images[0]).filter(Boolean);
  const spreads = (photos.length ? photos : ['']).slice(0, 6).map((src, i) => {
    const step = trip.steps[i];
    const code = PREFECTURE_ID_BY_SLUG[slugForName(step?.prefectureName ?? '')] ?? 0;
    return { src, place: step?.placeName || step?.title || '', code };
  });

  const pageW = Math.min(width - space.lg * 2, 420);
  const spreadH = pageW * 0.62;

  const onSpreadScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / pageW);
    if (i !== spread) setSpread(Math.max(0, Math.min(spreads.length - 1, i)));
  };

  const openPlan = (p: 'premium' | 'regular') => { setSent(false); setPlan(p); };

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

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onSpreadScroll}
          scrollEventThrottle={16}
          snapToInterval={pageW}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: (width - pageW) / 2 }}
        >
          {spreads.map((s, i) => (
            <View key={i} style={{ width: pageW }}>
              <View style={[styles.spread, { height: spreadH, borderColor: palette.ruleStrong }]}>
                {/* 左: 写真の面 */}
                <View style={styles.leaf}>
                  {s.src ? (
                    <Image source={{ uri: s.src }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.fill }]} />
                  )}
                  <View style={styles.leafCap}>
                    <AppText style={styles.leafCapText} numberOfLines={1}>{s.place}</AppText>
                  </View>
                </View>

                {/* 綴じ（谷折り） */}
                <View style={styles.gutter} />

                {/* 右: 奉書紙の白紙。御朱印はここに直接いただく */}
                <View style={styles.leaf}>
                  <WashiBackground />
                  <View style={styles.blankLeaf}>
                    {s.code ? (
                      <View style={{ opacity: 0.16 }}>
                        <Stamp
                          goshuin={{ id: `pv${i}`, prefectureId: s.code, prefectureName: '', kanji: PREFECTURE_KANJI_BY_ID[s.code] ?? '', acquired: true } as any}
                          size={Math.min(96, spreadH * 0.5)}
                          rotate={-4}
                        />
                      </View>
                    ) : null}
                    <View style={styles.blankHint}>
                      <AppText style={{ fontFamily: fonts.brush, fontSize: 11, color: '#8C8478' }}>
                        御朱印
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <Gap h={space.sm} />
        <Row style={{ justifyContent: 'center', gap: 6 }}>
          {spreads.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === spread ? 16 : 6, height: 6, borderRadius: 3,
                backgroundColor: i === spread ? palette.matcha : palette.rule,
              }}
            />
          ))}
        </Row>
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
      <Modal visible={plan !== null} transparent animationType="fade" onRequestClose={() => setPlan(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPlan(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: palette.washi }]} onPress={() => {}}>
            {sent ? (
              <View style={{ alignItems: 'center', paddingVertical: space.lg }}>
                <Ionicons name="checkmark-circle" size={38} color={palette.matcha} />
                <Gap h={space.sm} />
                <AppText variant="h3" tone="ink" center>{t('bind.thanks')}</AppText>
                <Gap h={space.lg} />
                <Button label={t('common.close')} tone="matcha" onPress={() => setPlan(null)} />
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
  spread: {
    flexDirection: 'row', borderRadius: 8, overflow: 'hidden',
    borderWidth: hairline, backgroundColor: '#FBF8F0',
    shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  leaf: { flex: 1, overflow: 'hidden' },
  // 谷折りの陰
  gutter: { width: 10, backgroundColor: 'rgba(120,110,95,0.16)' },
  leafCap: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 8, backgroundColor: 'rgba(0,0,0,0.42)' },
  leafCapText: { fontFamily: fonts.gothicMedium, fontSize: 10, color: '#fff' },
  blankLeaf: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blankHint: { position: 'absolute', right: 10, bottom: 8 },
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
