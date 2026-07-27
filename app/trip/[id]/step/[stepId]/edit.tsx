import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StepEditor } from '@/components/StepEditor';
import { useTrip } from '@/lib/useData';
import { useTheme } from '@/lib/useTheme';

export default function EditStep() {
  const { palette } = useTheme();
  const { id, stepId } = useLocalSearchParams<{ id: string; stepId: string }>();
  const { trip } = useTrip(id); // DB (or mock fallback) — prefills the editor
  const step = trip?.steps.find((s) => s.id === stepId);

  if (!step) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.matcha} />
      </View>
    );
  }
  return <StepEditor step={step} tripId={id} />;
}
