import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { UgcCard } from '@/components/UgcCard';
import { AppText, Row, Rule, Gap, Button } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { gallery } from '@/lib/mock';

export default function UgcPreview() {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const card = gallery[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title="プレビュー" />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center' }}>
        <UgcCard card={card} width={width * 0.6} />
        <Gap h={space.lg} />
        <Row
          style={[styles.badge, { borderColor: palette.ruleStrong }]}
        >
          <Ionicons name="construct-outline" size={14} color={palette.inkFaint} />
          <AppText variant="small" tone="inkFaint">
            高画質レンダリングは準備中（プレビューは簡易版）
          </AppText>
        </Row>
      </View>
      <View style={{ padding: space.lg }}>
        <Button label="シェアする" tone="shu" onPress={() => router.push('/share')} />
        <Gap h={space.sm} />
        <Button label="調整に戻る" variant="text" tone="ink" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  badge: {
    gap: 6,
    alignItems: 'center',
    borderWidth: hairline,
    borderRadius: 999,
    paddingHorizontal: space.md,
    paddingVertical: 8,
  },
});
