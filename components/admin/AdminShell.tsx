/**
 * 管理コンソール共通の枠。権限チェック、読み込み中、そしてページ間のタブを持つ。
 * 分析は情報量が多いので、1ページに詰め込まず「日本全体 → 都道府県 → スポット」
 * の段階で見られるようにしている。
 */
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

const TABS = [
  { path: '/admin', label: 'Japan' },
  { path: '/admin/prefectures', label: 'Prefectures' },
  { path: '/admin/spots', label: 'Spots' },
  { path: '/admin/orders', label: 'Orders' },
  { path: '/admin/manage', label: 'Manage' },
];

export function AdminShell({
  title,
  role,
  children,
  back,
}: {
  title: string;
  role: string | null | 'loading';
  children: React.ReactNode;
  /** 都道府県の詳細など、タブではなく戻るで扱うページ */
  back?: boolean;
}) {
  const { palette } = useTheme();
  const pathname = usePathname();

  if (role === 'loading') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">Loading…</AppText>
      </SafeAreaView>
    );
  }
  if (!role) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
        <Header title="Admin" />
        <Rule />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
          <Ionicons name="lock-closed-outline" size={40} color={palette.inkFaint} />
          <Gap h={space.sm} />
          <AppText variant="h3" tone="ink">Admins only</AppText>
          <AppText variant="small" tone="inkFaint" center>Sign in with an administrator account to open this console.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={title} />
      {!back && (
        <Row style={[styles.tabs, { borderBottomColor: palette.rule }]}>
          {TABS.map((t) => {
            const on = pathname === t.path;
            return (
              <Pressable key={t.path} onPress={() => router.replace(t.path as any)} style={styles.tab}>
                <AppText variant="small" tone={on ? 'matcha' : 'inkFaint'}>{t.label}</AppText>
                <View style={[styles.tabBar, { backgroundColor: on ? palette.matcha : 'transparent' }]} />
              </Pressable>
            );
          })}
        </Row>
      )}
      {back && <Rule />}
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl, maxWidth: 760, alignSelf: 'center', width: '100%' }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** 見出しつきの囲み。表とグラフの区切りに使う。 */
export function Panel({ title, hint, children }: { title?: string; hint?: string; children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.panel, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
      {!!title && (
        <>
          <AppText variant="eyebrow" tone="inkFaint">{title}</AppText>
          {!!hint && <><Gap h={2} /><AppText variant="small" tone="inkFaint">{hint}</AppText></>}
          <Gap h={space.md} />
        </>
      )}
      {children}
    </View>
  );
}

export function TableRow({ cells, header, wide = 1 }: { cells: string[]; header?: boolean; wide?: number }) {
  const { palette } = useTheme();
  return (
    <Row style={[styles.tr, header && { backgroundColor: palette.fill }]}>
      {cells.map((c, i) => (
        <AppText
          key={i}
          variant={header ? 'eyebrow' : 'small'}
          tone={header ? 'inkFaint' : 'ink'}
          numberOfLines={1}
          style={{ flex: i === wide ? 2 : 1, paddingHorizontal: 8 }}
        >
          {c}
        </AppText>
      ))}
    </Row>
  );
}

export const styles = StyleSheet.create({
  tabs: { borderBottomWidth: hairline, paddingHorizontal: space.md },
  tab: { paddingHorizontal: space.md, paddingTop: space.sm, alignItems: 'center', gap: 6 },
  tabBar: { height: 2, width: 28, borderRadius: 1 },
  panel: { borderWidth: hairline, borderRadius: 10, padding: space.md },
  tr: { paddingVertical: 10, paddingHorizontal: 6, borderBottomWidth: hairline, borderBottomColor: 'rgba(0,0,0,0.05)' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: { width: '23%', minWidth: 130, flexGrow: 1, borderWidth: hairline, borderRadius: 10, padding: space.md, alignItems: 'center' },
});

/** KPI タイル群。 */
export function Tiles({ items }: { items: [string, string | number][] }) {
  const { palette } = useTheme();
  return (
    <View style={styles.tileGrid}>
      {items.map(([label, value]) => (
        <View key={label} style={[styles.tile, { borderColor: palette.rule, backgroundColor: palette.paper }]}>
          <AppText variant="h2" tone="ink">{String(value)}</AppText>
          <AppText variant="eyebrow" tone="inkFaint" center>{label}</AppText>
        </View>
      ))}
    </View>
  );
}
