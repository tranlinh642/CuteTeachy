import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useTasks } from '@cute-teachy/api';
import { isValidISODate } from '@cute-teachy/core';
import { SheetSurface } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { TaskForm } from './TaskForm';

/** Route modal `/new-task?id=&date=` – tạo mới hoặc chỉnh sửa công việc. */
export function NewTaskScreen() {
  const router = useRouter();
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
  const { data: tasks, isPending } = useTasks();
  const close = () => router.back();

  const initialTask = id ? tasks?.find((task) => task.id === id) : undefined;

  // Chờ dữ liệu khi mở ở chế độ sửa để form khởi tạo đúng giá trị
  if (id && isPending) {
    return (
      <SheetSurface onClose={close}>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </SheetSurface>
    );
  }

  return (
    <TaskForm
      key={initialTask?.id ?? 'new'}
      initialTask={initialTask}
      defaultDate={date && isValidISODate(date) ? date : undefined}
      onClose={close}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    paddingVertical: spacing[8],
  },
});
