import { View, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '@/lib/useTheme';
import { useSession } from '@/lib/useSession';
import { FloatingTabBar } from '@/components/FloatingTabBar';

export default function TabsLayout() {
  const { palette } = useTheme();

  /**
   * ゲスト（未ログイン）でもタブの中に入れる。
   *
   * ここで弾いてログイン画面に落とすと、他の旅人の記録を見ることすらできず、
   * 何のアプリなのか分からないまま登録を求めることになる。公開の旅は
   * RLS が未ログインでも読ませるので、見せる側は素通しでよい。
   * 保存が要る操作だけ、その場で SignInPrompt を出して止める。
   *
   * 読み込み中は判定を待つ（一瞬ゲスト扱いの画面が出るのを避ける）。
   */
  const { signedIn } = useSession();

  if (signedIn === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.washi }}>
        <ActivityIndicator color={palette.matcha} />
      </View>
    );
  }

  return (
    <Tabs
      /**
       * バーは自前で描く。
       * ライブラリの tabBarIcon は focused の有無で二重に呼ばれるため、
       * アイコン側に水玉を仕込むと全部のタブに水玉が出た（実測）。
       * 水玉を「バーの中を滑る一枚」として持つには、バーごと自分で持つのが早い。
       */
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="map" />
      {/* 御朱印は /map の中のボトムシートで見せるので、タブには並べない。
          直接開いたときのために経路だけ残す */}
      <Tabs.Screen name="goshuin" options={{ href: null }} />
      <Tabs.Screen name="explore" />
      {/* 設定の奥だと気づかれないので、お知らせはタブに出す */}
      <Tabs.Screen name="notifications" />
    </Tabs>
  );
}
