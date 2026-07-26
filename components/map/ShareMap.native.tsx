import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import type { Step } from '@/lib/mock';

export function ShareMap({ steps, height }: { steps: Step[]; height: number }) {
  return (
    <View style={{ height, backgroundColor: '#0b1a2b', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Ionicons name="map" size={40} color="#69AF00" />
      <AppText variant="small" style={{ color: '#fff' }}>{steps.length} stops · web preview</AppText>
    </View>
  );
}
