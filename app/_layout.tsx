import { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import {
  ShipporiMincho_400Regular,
  ShipporiMincho_500Medium,
  ShipporiMincho_700Bold,
} from '@expo-google-fonts/shippori-mincho';
import {
  ZenKakuGothicNew_400Regular,
  ZenKakuGothicNew_500Medium,
  ZenKakuGothicNew_700Bold,
  useFonts,
} from '@expo-google-fonts/zen-kaku-gothic-new';
import { YujiSyuku_400Regular } from '@expo-google-fonts/yuji-syuku';
import { useTheme } from '@/lib/useTheme';
import { TransitionProvider } from '@/lib/transition';
import { StampPressProvider } from '@/lib/stampPress';
import { trackPageView } from '@/lib/analytics';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // GA4: SPAは初回しか page_view が飛ばないので、遷移のたびに自分で送る
  const pathname = usePathname();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  const { palette, scheme } = useTheme();
  const [loaded] = useFonts({
    ShipporiMincho_400Regular,
    ShipporiMincho_500Medium,
    ShipporiMincho_700Bold,
    ZenKakuGothicNew_400Regular,
    ZenKakuGothicNew_500Medium,
    ZenKakuGothicNew_700Bold,
    YujiSyuku_400Regular,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  /**
   * Web ではフォントを待たない。
   *
   * 明朝もゴシックも合わせて13本あり、最後の1本が届くのが実測で約1.4秒。
   * それまで画面を空にしていたので、地図が遅れて出てくるように見えていた。
   * ブラウザは自前でフォントを差し替えられるので、先に組み立てて描き、
   * 字だけあとから入れ替わればいい。
   *
   * ネイティブは差し替えの仕組みが無く、字が出ないまま組むと崩れるので
   * 従来どおり待つ。
   */
  if (!loaded && Platform.OS !== 'web') return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <StampPressProvider>
        <TransitionProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.washi },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="trip/new"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="share"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </Stack>
        </TransitionProvider>
        </StampPressProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
