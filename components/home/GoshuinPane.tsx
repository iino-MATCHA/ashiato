/**
 * ボトムシートの中身（御朱印）。
 * 集めた印の一覧と、シェアの導線だけ。地図とゲージとランクは
 * シートの外（画面上部）に出ているので、ここでは繰り返さない。
 */
import { useState } from 'react';
import { View, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Rule, Gap, Button } from '@/components/ui';
import { Stamp } from '@/components/Stamp';
import { space, fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { goshuinList } from '@/lib/mock';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useSession } from '@/lib/useSession';
import { useI18n } from '@/lib/i18n';
import { useSheetOpen } from '@/components/BottomSheet';

export function GoshuinPane({ visited }: { visited: number[] }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { guest } = useSession();
  // たたんでいる間は動かさない
  const sheetOpen = useSheetOpen();
  const [askSignIn, setAskSignIn] = useState(false);
  // 「これは本物の御朱印なのか」に、押したときだけ答える
  const [about, setAbout] = useState(false);
  const visitedSet = new Set(visited);

  return (
    <ScrollView
      scrollEnabled={sheetOpen}
      // 浮いたタブバーに最後の行が隠れないよう、下を厚めに空ける
      contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl * 2 }}
      showsVerticalScrollIndicator={false}
    >
      {/* このアプリの御朱印は、寺社でいただく本物とは別のもの。
          誤解されると信用に関わるので、一覧の先頭で断っておく。
          ただし読ませるのは押した人にだけ ―― 面を説明で埋めない。 */}
      <Pressable onPress={() => setAbout(true)} hitSlop={6} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
        <Row style={{ gap: 6, alignItems: 'center', paddingVertical: space.sm }}>
          <Ionicons name="information-circle-outline" size={16} color={palette.matcha} />
          <AppText variant="small" tone="matcha">{t('goshuin.aboutLink')}</AppText>
        </Row>
      </Pressable>
      <Gap h={space.sm} />

      {/* ゲストの帳面は真っ白なので、なぜ空なのかをここで言う */}
      {guest && (
        <>
          <Rule />
          <Pressable onPress={() => setAskSignIn(true)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <Row style={{ gap: space.sm, alignItems: 'center', paddingVertical: space.md }}>
              <Ionicons name="footsteps-outline" size={18} color={palette.matcha} />
              <AppText variant="small" tone="inkSoft" style={{ flex: 1, lineHeight: 20 }}>
                {t('guest.goshuinBody')}
              </AppText>
              <Ionicons name="chevron-forward" size={16} color={palette.inkFaint} />
            </Row>
          </Pressable>
          <Rule />
          <Gap h={space.md} />
        </>
      )}

      <SignInPrompt visible={askSignIn} onClose={() => setAskSignIn(false)} reason="collect" />

      {/* visible={false} でも中身がDOMに残るので、開いている間だけ組み立てる */}
      {about && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setAbout(false)}>
          <Pressable style={styles.backdrop} onPress={() => setAbout(false)}>
            <Pressable
              style={[styles.sheet, { backgroundColor: palette.paper, borderColor: palette.rule }]}
              onPress={() => {}}
            >
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="bookmark-outline" size={30} color={palette.shu} />
                <Gap h={space.md} />
                <AppText style={[styles.aboutTitle, { color: palette.ink }]} center>
                  {t('goshuin.aboutTitle')}
                </AppText>
              </View>
              <Gap h={space.lg} />
              <AppText variant="small" tone="ink" style={{ lineHeight: 22, opacity: 0.88 }}>
                {t('goshuin.aboutWhat')}
              </AppText>
              <Gap h={space.md} />
              <AppText variant="small" tone="ink" style={{ lineHeight: 22, opacity: 0.88 }}>
                {t('goshuin.aboutOurs')}
              </AppText>
              <Gap h={space.md} />
              <AppText variant="small" tone="inkFaint" style={{ lineHeight: 20 }}>
                {t('goshuin.aboutReal')}
              </AppText>
              <Gap h={space.xl} />
              <Button label={t('common.close')} tone="matcha" onPress={() => setAbout(false)} />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      <View style={styles.grid}>
        {goshuinList.map((g, i) => {
          const acquired = visitedSet.has(g.prefectureId);
          return (
            <View key={g.id} style={styles.cell}>
              <Stamp goshuin={{ ...g, acquired }} size={80} rotate={((i * 7) % 9) - 4} />
              <Gap h={space.sm} />
              <AppText variant="small" tone={acquired ? 'inkSoft' : 'inkFaint'} center numberOfLines={1}>
                {g.prefectureName}
              </AppText>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  sheet: {
    width: '100%', maxWidth: 360, borderRadius: 18, padding: space.lg, borderWidth: hairline,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
  aboutTitle: { fontFamily: fonts.minchoBold, fontSize: 22, lineHeight: 31 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.xl },
  cell: { width: '30%', alignItems: 'center' },
});
