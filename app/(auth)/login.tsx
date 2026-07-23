import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

const providers = [
  { key: 'apple', label: 'Appleでつづける', icon: 'logo-apple' as const },
  { key: 'google', label: 'Googleでつづける', icon: 'logo-google' as const },
  { key: 'line', label: 'LINEでつづける', icon: 'chatbubble' as const },
];

export default function Login() {
  const { palette } = useTheme();
  const [agreed, setAgreed] = useState(true);

  const go = () => router.replace('/(auth)/onboarding');

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.washi }]}>
      {/* 上部：ブランドとコピー */}
      <View style={styles.top}>
        <AppText variant="eyebrow" tone="shu">
          ASHIATO — 旅の足跡を、日本地図に
        </AppText>
        <Gap h={space.lg} />
        <AppText style={styles.brand} tone="ink">
          足跡
        </AppText>
        <Gap h={space.md} />
        <AppText variant="h3" tone="inkSoft" style={{ maxWidth: 260 }}>
          歩いた場所が、地図になる。{'\n'}訪れた土地で、御朱印が集まる。
        </AppText>
      </View>

      {/* 下部：認証 */}
      <View>
        {providers.map((p, i) => (
          <View key={p.key}>
            {i === 0 && <Rule />}
            <Pressable
              onPress={go}
              style={({ pressed }) => [styles.provider, pressed && { opacity: 0.5 }]}
            >
              <Ionicons name={p.icon} size={22} color={palette.ink} />
              <AppText variant="bodyStrong" tone="ink" style={{ flex: 1 }}>
                {p.label}
              </AppText>
              <Ionicons name="arrow-forward" size={18} color={palette.inkFaint} />
            </Pressable>
            <Rule />
          </View>
        ))}

        <Gap h={space.lg} />
        <Pressable
          onPress={go}
          style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
        >
          <Row style={{ justifyContent: 'center', gap: 6 }}>
            <AppText variant="small" tone="inkSoft">
              メールアドレスで登録／ログイン
            </AppText>
            <AppText variant="small" tone="ai">
              →
            </AppText>
          </Row>
        </Pressable>

        <Gap h={space.lg} />
        <Pressable onPress={() => setAgreed((v) => !v)} style={styles.consent}>
          <View
            style={[
              styles.check,
              { borderColor: palette.ruleStrong },
              agreed && { backgroundColor: palette.ai, borderColor: palette.ai },
            ]}
          >
            {agreed && <Ionicons name="checkmark" size={13} color={palette.paper} />}
          </View>
          <AppText variant="small" tone="inkFaint" style={{ flex: 1 }}>
            <AppText variant="small" tone="ai">利用規約</AppText>
            {' と '}
            <AppText variant="small" tone="ai">プライバシーポリシー</AppText>
            {' に同意します'}
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.xxl,
    paddingBottom: space.xl,
    justifyContent: 'space-between',
  },
  top: { flex: 1, justifyContent: 'center' },
  brand: {
    fontFamily: fonts.minchoBold,
    fontSize: 88,
    lineHeight: 96,
    letterSpacing: 4,
  },
  provider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md + 2,
  },
  consent: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  check: {
    width: 20,
    height: 20,
    borderWidth: hairline * 2,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
});
