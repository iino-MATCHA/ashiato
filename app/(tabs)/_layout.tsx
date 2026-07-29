import { View, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';

export default function TabsLayout() {
  const { palette } = useTheme();
  const { t } = useI18n();

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
        tabBarInactiveTintColor: palette.inkFaint,
        tabBarStyle: {
          backgroundColor: palette.washi,
          borderTopColor: palette.rule,
          borderTopWidth: hairline,
          elevation: 0,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.gothicMedium,
          fontSize: 10,
          letterSpacing: 1,
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
