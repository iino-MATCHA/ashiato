import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row } from './ui';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

/** スタック画面の細いヘッダー。戻る＋任意タイトル＋右アクション。 */
export function Header({
  title,
  closeIcon,
  right,
}: {
  title?: string;
  closeIcon?: boolean;
  right?: React.ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <Row style={styles.wrap}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/map'))}
        hitSlop={12}
        style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
      >
        <Ionicons
          name={closeIcon ? 'close' : 'arrow-back'}
          size={24}
          color={palette.ink}
        />
      </Pressable>
      {title ? (
        <AppText variant="bodyStrong" tone="ink" numberOfLines={1} style={styles.title}>
          {title}
        </AppText>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <View style={styles.right}>{right}</View>
    </Row>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 52,
    paddingHorizontal: space.lg,
    justifyContent: 'space-between',
  },
  title: { flex: 1, textAlign: 'center', marginHorizontal: space.md },
  right: { minWidth: 24, alignItems: 'flex-end' },
});
