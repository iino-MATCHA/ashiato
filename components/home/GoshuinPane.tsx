/**
 * ボトムシートの中身（御朱印）。
 * 集めた印の一覧と、シェアの導線だけ。地図とゲージとランクは
 * シートの外（画面上部）に出ているので、ここでは繰り返さない。
 */
import { useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { Stamp } from '@/components/Stamp';
import { space } from '@/lib/theme';
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
  const visitedSet = new Set(visited);

  return (
    <ScrollView
      scrollEnabled={sheetOpen}
      // 浮いたタブバーに最後の行が隠れないよう、下を厚めに空ける
      contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl * 2 }}
      showsVerticalScrollIndicator={false}
    >
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
