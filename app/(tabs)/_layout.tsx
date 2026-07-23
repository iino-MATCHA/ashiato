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
          title: 'Trips',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="earth-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goshuin"
        options={{
          title: 'Goshuin',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ribbon-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size - 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
