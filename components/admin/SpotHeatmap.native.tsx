/**
 * ネイティブ側のスポットヒートマップ。管理コンソールは Web 前提のため、
 * ここでは案内だけ出す（native の地図は @rnmapbox/maps 導入時に対応）。
 */
import { View } from 'react-native';
import { AppText } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

export interface SpotPoint {
  code: string | number;
  name: string;
  lat: number;
  lng: number;
  visits: number;
}

export function SpotHeatmap({ points, height = 420 }: { points: SpotPoint[]; height?: number }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        height,
        borderRadius: 12,
        borderWidth: hairline,
        borderColor: palette.rule,
        backgroundColor: palette.fill,
        alignItems: 'center',
        justifyContent: 'center',
        padding: space.lg,
      }}
    >
      <AppText variant="small" tone="inkFaint" center>
        The spot heatmap ({points.length} places) is available in the web console.
      </AppText>
    </View>
  );
}
