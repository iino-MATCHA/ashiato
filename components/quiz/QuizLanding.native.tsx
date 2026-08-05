/**
 * 診断LPのネイティブ側。
 *
 * **診断そのものはWeb専用にしてある。** この画面は広告（Meta / Google）と
 * MATCHAの記事からの着地で、流入はすべてブラウザ。アプリの中から
 * /quiz を開くのは、共有リンクを踏んだときくらいしか無い。
 * 実装を2つ持って片方を検証できないままにするより、ネイティブは
 * アプリ本来の入口（都道府県を選ぶ画面）へ送る。
 *
 * ネイティブでも診断をやることになったら、questions / data / score /
 * photos はそのまま使える（プラットフォームに依存していない）。
 * 作り直すのは表示だけで済む。
 */
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText, Gap, Eyebrow } from '@/components/ui';
import { space, fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';

export function QuizLanding() {
  const { palette } = useTheme();
  const { t } = useI18n();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.washi }]}>
      <View style={{ paddingHorizontal: space.lg }}>
        <Eyebrow tone="matcha">{t('quiz.eyebrow')}</Eyebrow>
        <Gap h={space.md} />
        <AppText style={[styles.title, { color: palette.ink }]}>{t('quiz.hero.title')}</AppText>
        <Gap h={space.md} />
        <AppText variant="body" tone="inkSoft">{t('quiz.hero.lead')}</AppText>
        <Gap h={space.xl} />
        <Pressable
          onPress={() => router.replace('/(auth)/prefectures')}
          style={({ pressed }) => [styles.cta, { backgroundColor: palette.matcha }, pressed && { opacity: 0.85 }]}
        >
          <AppText variant="bodyStrong" style={{ color: '#fff' }}>{t('quiz.hero.cta')}</AppText>
        </Pressable>
        <Gap h={space.md} />
        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <AppText variant="small" tone="ai" center>{t('quiz.hero.signin')}</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center' },
  title: { fontFamily: fonts.minchoBold, fontSize: 34, lineHeight: 44 },
  cta: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
