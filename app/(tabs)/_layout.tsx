import { View, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fonts, hairline, space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';

export default function TabsLayout() {
  const { palette } = useTheme();
  const { t } = useI18n();
  /**
   * 画面下の安全領域（ホームバー・ブラウザの下部バー）。
   * これを足さないと、タブの文字が端末の下端に貼りついて隠れる。
   * バーの背景ごと安全領域まで伸ばし、文字はその上に置く。
   */
  const insets = useSafeAreaInsets();

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
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.matcha,
        // 生成り。inkFaint だと暗い地に沈んで読めなかった（実測 4.1:1）
        tabBarInactiveTintColor: palette.kinari,
        /**
         * ラベル（文字）は出さない。
         * スマホのChromeはツールバーをページに重ねて描く状態があり、
         * バーの下端は何をどう測っても最後の20px前後が欠け得る。
         * そこで文字をやめてアイコンだけを**バーの上半分**に置き、
         * 下側はただの余白にする。下半分が隠れても、失うものが無い。
         */
        tabBarShowLabel: false,
        /**
         * 画面の下端に貼りつけず、少し浮かせて角を丸める。
         * 端末の安全領域ぶんだけ床から離し、左右にも余白を取る。
         */
        tabBarStyle: {
          position: 'absolute',
          left: space.md,
          right: space.md,
          bottom: Math.max(insets.bottom, 10),
          height: 62,
          paddingTop: 0,
          paddingBottom: 0,
          borderRadius: 22,
          backgroundColor: palette.washi,
          borderTopWidth: 0,
          borderWidth: hairline,
          borderColor: palette.rule,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.14,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
        },
        /**
         * 選ばれている項目だけ、薄い面で囲う。
         * アイコン側に水玉を仕込む手も試したが、react-navigation は
         * focused の有無で二重に描くため、全部のタブに水玉が出た（実測）。
         * ライブラリ側の「選択中の背景」を使えば一つだけに掛かる。
         */
        tabBarActiveBackgroundColor: palette.fill,
        tabBarItemStyle: {
          height: 46,
          marginVertical: 8,
          marginHorizontal: 8,
          borderRadius: 16,
          // 背景は内側のリンク要素に付くので、ここで丸く切り抜く
          overflow: 'hidden',
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: t('tab.trips'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="earth-outline" size={size - 2} color={color} />
          ),
        }}
      />
      {/* 御朱印は /map の中のボトムシートで見せるので、タブには並べない。
          直接開いたときのために経路だけ残す（href: null で下のバーから隠す） */}
      <Tabs.Screen name="goshuin" options={{ href: null }} />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tab.explore'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size - 2} color={color} />
          ),
        }}
      />
      {/* 設定の奥だと気づかれないので、お知らせはタブに出す */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('tab.notifications'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size - 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
