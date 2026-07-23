import { useLocalSearchParams } from 'expo-router';
import { StepEditor } from '@/components/StepEditor';
import { allTrips } from '@/lib/mock';

export default function EditStep() {
  const { id, stepId } = useLocalSearchParams<{ id: string; stepId: string }>();
  const step = allTrips.flatMap((t) => t.steps).find((s) => s.id === stepId);
  return <StepEditor step={step} tripId={id} />;
}
