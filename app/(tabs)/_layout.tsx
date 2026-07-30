import { View, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fonts, hairline } from '@/lib/theme';
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
        tabBarStyle: {
          backgroundColor: palette.washi,
          borderTopColor: palette.rule,
          borderTopWidth: hairline,
          elevation: 0,
          height: 72 + insets.bottom,
          paddingTop: 10,
          // 下側を厚めに空けておく（ここが欠けても表示は壊れない）
          paddingBottom: 26 + insets.bottom,
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
      <Tabs.Screen
        name="goshuin"
        options={{
          title: t('tab.goshuin'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ribbon-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tab.explore'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size - 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
