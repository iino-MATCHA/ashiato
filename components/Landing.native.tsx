/**
 * 未ログインで「/」に来た人へのランディングページ（1枚）。
 * 外部画像・地図タイルを使わず、SVGの日本地図と御朱印・紙のモックだけで
 * 組んでいるので軽い（スクロールが重くならない）。
 */
import { View, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { AppText, Row, Gap, Button } from '@/components/ui';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { Stamp } from '@/components/Stamp';
import { space, fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';

/** ヒーローの地図で塗っておく県（東京→九州の大胆な旅のイメージ） */
const DEMO_VISITED = [13, 22, 26, 27, 34, 40, 43, 46];

export function Landing() {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const { t } = useI18n();
  const contentW = Math.min(width - space.lg * 2, 560);
  const mapW = Math.min(contentW, 340);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingBottom: space.xxl }}>
        <View style={{ width: contentW }}>

          {/* ヒーロー */}
          <Gap h={space.xl} />
          <AppText variant="eyebrow" tone="matcha" center>A S H I A T O</AppText>
          <Gap h={space.sm} />
          <AppText variant="display" tone="ink" center style={{ fontFamily: fonts.minchoBold }}>
            {t('lp.tagline')}
          </AppText>
          <Gap h={space.md} />
          <AppText variant="body" tone="inkSoft" center>{t('lp.sub')}</AppText>

          <Gap h={space.lg} />
          <Button label={t('lp.cta')} tone="matcha" onPress={() => router.push('/(auth)/login')} />
          <Gap h={space.sm} />
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <AppText variant="small" tone="inkFaint" center>{t('lp.haveAccount')}</AppText>
          </Pressable>

          {/* 地図＋御朱印（遊び） */}
          <Gap h={space.xl} />
          <View style={{ alignItems: 'center' }}>
            <View>
              <JapanSvgMap visited={DEMO_VISITED} width={mapW} okinawaInset />
              {/* 傾いた御朱印を重ねる */}
              <View style={{ position: 'absolute', top: -8, right: -6 }}>
                <Stamp goshuin={{ id: 'lp1', prefectureId: 13, prefectureName: 'Tokyo', kanji: '東', acquired: true } as any} size={64} rotate={8} />
              </View>
              <View style={{ position: 'absolute', bottom: 26, left: -4 }}>
                <Stamp goshuin={{ id: 'lp2', prefectureId: 46, prefectureName: 'Kagoshima', kanji: '薩', acquired: true } as any} size={58} rotate={-7} />
              </View>
            </View>
            <Gap h={space.sm} />
            <AppText variant="small" tone="inkFaint" center>{t('lp.mapCaption')}</AppText>
          </View>

          {/* 3つの柱 */}
          <Gap h={space.xl} />
          {[
            { icon: 'footsteps-outline', title: t('lp.f1t'), body: t('lp.f1b') },
            { icon: 'ribbon-outline', title: t('lp.f2t'), body: t('lp.f2b') },
            { icon: 'book-outline', title: t('lp.f3t'), body: t('lp.f3b') },
          ].map((f) => (
            <Row key={f.icon} style={[styles.feature, { borderColor: palette.rule }]}>
              <View style={[styles.featureIcon, { backgroundColor: palette.fill }]}>
                <Ionicons name={f.icon as any} size={20} color={palette.matcha} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" tone="ink">{f.title}</AppText>
                <AppText variant="small" tone="inkFaint">{f.body}</AppText>
              </View>
            </Row>
          ))}

          {/* ジャーナルPDFのモック（紙を重ねたイメージ） */}
          <Gap h={space.xl} />
          <AppText variant="eyebrow" tone="matcha">{t('lp.journalEyebrow')}</AppText>
          <Gap h={space.md} />
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: mapW * 0.62, height: mapW * 0.88 }}>
              {/* 後ろの2枚 */}
              <View style={[styles.page, styles.pageBack2, { backgroundColor: palette.paper, borderColor: palette.rule }]} />
              <View style={[styles.page, styles.pageBack1, { backgroundColor: palette.paper, borderColor: palette.rule }]} />
              {/* 表の1枚: 表紙風 */}
              <View style={[styles.page, { backgroundColor: '#FBFAF7', borderColor: palette.ruleStrong }]}>
                <View style={{ flex: 5, backgroundColor: '#DCE9C4' }} />
                <Row style={{ flex: 1.6, gap: 3, paddingTop: 3 }}>
                  <View style={{ flex: 1, backgroundColor: '#C9D8AC' }} />
                  <View style={{ flex: 1, backgroundColor: '#E8E7E1' }} />
                  <View style={{ flex: 1, backgroundColor: '#D5CDBE' }} />
                </Row>
                <View style={{ flex: 2.6, padding: 10, justifyContent: 'center' }}>
                  <AppText style={{ fontFamily: fonts.gothicMedium, fontSize: 7, letterSpacing: 2, color: '#A5A19A' }}>ASHIATO</AppText>
                  <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 15, color: '#1B1815' }}>{t('lp.journalMockTitle')}</AppText>
                  <AppText style={{ fontFamily: fonts.gothicRegular, fontSize: 8, color: '#6B6862' }}>2026.05.02 – 05.06</AppText>
                </View>
              </View>
            </View>
            <Gap h={space.md} />
            <AppText variant="small" tone="inkFaint" center>{t('lp.journalCaption')}</AppText>
          </View>

          {/* 製本（御朱印帳）のモック: 蛇腹 */}
          <Gap h={space.xl} />
          <AppText variant="eyebrow" tone="matcha">{t('lp.bookEyebrow')}</AppText>
          <Gap h={space.md} />
          <View style={{ alignItems: 'center' }}>
            <Row style={{ alignItems: 'center' }}>
              {/* 表紙（濃紺の布のイメージ） */}
              <View style={[styles.goshuinCover]}>
                <AppText style={{ fontFamily: fonts.brush, fontSize: 16, color: '#F2EFE6', textAlign: 'center', lineHeight: 22 }}>
                  {'足\n跡'}
                </AppText>
              </View>
              {/* 蛇腹のページ */}
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.accordion, { backgroundColor: i % 2 ? '#F6F4EC' : '#FBFAF7', borderColor: palette.rule, transform: [{ skewY: i % 2 ? '2deg' : '-2deg' }] }]}>
                  <View style={{ transform: [{ rotate: `${(i - 1) * 4}deg` }] }}>
                    <Stamp
                      goshuin={{ id: `bk${i}`, prefectureId: [26, 34, 40][i], prefectureName: '', kanji: ['京', '芸', '筑'][i], acquired: true } as any}
                      size={44}
                    />
                  </View>
                </View>
              ))}
            </Row>
            <Gap h={space.md} />
            <AppText variant="small" tone="inkFaint" center>{t('lp.bookCaption')}</AppText>
          </View>

          {/* 締めのCTA */}
          <Gap h={space.xl} />
          <View style={[styles.closing, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
            <Svg width={44} height={16} viewBox="0 0 44 16">
              <Path d="M2 12 C 12 2, 20 14, 30 6 S 42 10, 42 4" stroke="#69AF00" strokeWidth={2} fill="none" strokeLinecap="round" strokeDasharray="1 5" />
            </Svg>
            <Gap h={space.sm} />
            <AppText variant="h3" tone="ink" center>{t('lp.closing')}</AppText>
            <Gap h={space.md} />
            <Button label={t('lp.cta')} tone="matcha" onPress={() => router.push('/(auth)/login')} />
          </View>

          <Gap h={space.xl} />
          <AppText variant="small" tone="inkFaint" center>ASHIATO by MATCHA</AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  langPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: hairline * 2 },
  feature: { gap: space.md, alignItems: 'center', borderWidth: hairline, borderRadius: 12, padding: space.md, marginBottom: space.sm },
  featureIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  page: { position: 'absolute', inset: 0 as any, borderWidth: hairline, borderRadius: 6, overflow: 'hidden' },
  pageBack1: { transform: [{ rotate: '-3deg' }, { translateX: -8 }] },
  pageBack2: { transform: [{ rotate: '4deg' }, { translateX: 10 }] },
  goshuinCover: { width: 64, height: 96, borderRadius: 4, backgroundColor: '#2B3A55', alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  accordion: { width: 58, height: 92, borderWidth: hairline, alignItems: 'center', justifyContent: 'center', marginLeft: -1 },
  closing: { borderWidth: hairline, borderRadius: 14, padding: space.lg, alignItems: 'center' },
});
