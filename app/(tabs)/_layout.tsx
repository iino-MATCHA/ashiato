import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function TabsLayout() {
  const { palette } = useTheme();
  const { t } = useI18n();

  /**
   * タブの中の画面を直接開いた（＝リロードした）ときの入口。
   *
   * 以前は `/` の認証ゲートだけがセッションを見ていたので、`/map` を
   * リロードすると素通りして空のまま出ていた。ここでも見て、
   * セッションがあればそのまま、無ければ `/` へ返す。
   * セッションは localStorage に残っているので、読み直せばログインは続く。
   */
  const [signedIn, setSignedIn] = useState<boolean | null>(!isSupabaseConfigured ? true : null);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => alive && setSignedIn(!!data.session));
    return () => { alive = false; };
  }, []);

  if (signedIn === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.washi }}>
        <ActivityIndicator color={palette.matcha} />
      </View>
    );
  }
  if (!signedIn) return <Redirect href="/" />;

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
