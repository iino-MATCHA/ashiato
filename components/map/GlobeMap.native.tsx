import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

/**
 * Native placeholder. On device, replace with @rnmapbox/maps
 * (Mapbox globe) in a later native build. Web uses mapbox-gl.
 */
export function GlobeMap({ height = 300 }: { height?: number }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        height,
        backgroundColor: '#0b0b19',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.sm,
      }}
    >
      <Ionicons name="globe-outline" size={48} color={palette.aiSoft} />
      <AppText variant="small" style={{ color: '#8fb0d4' }}>
        Interactive globe (web) · native map coming soon
      </AppText>
    </View>
  );
}
