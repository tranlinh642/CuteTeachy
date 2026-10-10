import { useLocalSearchParams } from 'expo-router';
import { NewNoteScreen } from '@/features/notes';

export default function NewNoteRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <NewNoteScreen id={id} />;
}
