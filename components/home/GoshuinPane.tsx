/**
 * ボトムシートの中身（御朱印）。
 * 集めた印の一覧と、シェアの導線だけ。地図とゲージとランクは
 * シートの外（画面上部）に出ているので、ここでは繰り返さない。
 */
import { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { Stamp } from '@/components/Stamp';
import { AboutModal, markAboutSeen, shouldAutoOpenAbout } from '@/components/goshuin/AboutModal';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { goshuinList } from '@/lib/mock';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useSession } from '@/lib/useSession';
import { useI18n } from '@/lib/i18n';
import { useSheetOpen, useSheetScroll } from '@/components/BottomSheet';

export function GoshuinPane({ visited }: { visited: number[] }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { guest } = useSession();
  // たたんでいる間は動かさない
  const sheetOpen = useSheetOpen();
  const sheetScroll = useSheetScroll();
  const [askSignIn, setAskSignIn] = useState(false);
  // 「これは本物の御朱印なのか」に答えるモーダル。リンクからいつでも
  const [about, setAbout] = useState(false);
  const visitedSet = new Set(visited);

  // 初めてこの帳面を開いた端末には、一度だけ自動で説明を出す。
  // 本物の御朱印との混同は最初に断っておきたい。二度目からは出さない
  useEffect(() => {
    if (shouldAutoOpenAbout()) {
      markAboutSeen();
      setAbout(true);
    }
  }, []);

  return (
    <ScrollView
      scrollEnabled={sheetOpen}
      // 一番上にいるときに面を下へ払ったら、シートが閉じられるようにする
      {...sheetScroll}
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

      <AboutModal visible={about} onClose={() => setAbout(false)} />

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
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.xl },
  cell: { width: '30%', alignItems: 'center' },
});
