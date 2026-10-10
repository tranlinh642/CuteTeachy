import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useDeleteTask, useToggleTask } from '@cute-teachy/api';
import { useTranslation } from '@cute-teachy/i18n';
import type { Task } from '@cute-teachy/types';
import { ROUTES } from '@/lib/routes';

/** Hành động trên một công việc: đánh dấu xong (optimistic), sửa, xóa (có xác nhận). */
export function useTaskActions() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toggle } = useToggleTask();
  const deleteTask = useDeleteTask();

  const edit = (task: Task) => router.push({ pathname: ROUTES.newTask, params: { id: task.id } });

  const confirmDelete = (task: Task) =>
    Alert.alert(t('tasks.deleteConfirm', { title: task.title }), undefined, [
      { text: t('common.actions.cancel'), style: 'cancel' },
      { text: t('common.actions.delete'), style: 'destructive', onPress: () => deleteTask.mutate(task.id) },
    ]);

  return { toggle, edit, confirmDelete };
}
