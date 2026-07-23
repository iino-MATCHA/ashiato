import { useLocalSearchParams } from 'expo-router';
import { StepEditor } from '@/components/StepEditor';

export default function NewStep() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StepEditor tripId={id} />;
}
