import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

export default function TabsLayout() {
  const { palette } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.shu,
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
          title: 'マイマップ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: '旅',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goshuin"
        options={{
          title: '御朱印帳',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ribbon-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '発見',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'プロフィール',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size - 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
