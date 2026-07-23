import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import type { Step } from '@/lib/mock';

/**
 * Native placeholder. Replace with @rnmapbox/maps on device later.
 */
export function TripMap({
  steps,
  activeIndex,
  height = 360,
}: {
  steps: Step[];
  activeIndex: number;
  onSelect: (i: number) => void;
  height?: number;
  bottomInset?: number;
}) {
  const { palette } = useTheme();
  const active = steps[activeIndex];
  return (
    <View
      style={{
        height,
        backgroundColor: palette.fill,
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.sm,
      }}
    >
      <Ionicons name="map-outline" size={44} color={palette.aiSoft} />
      <AppText variant="small" tone="inkSoft">
        {active ? active.placeName : 'Route map'} · web map active
      </AppText>
    </View>
  );
}
