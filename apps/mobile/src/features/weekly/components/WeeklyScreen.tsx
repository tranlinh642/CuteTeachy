import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { getGreetingPeriod, selectCurrentUser, useSessionStore } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import { ScreenContainer } from '@/components/layout';
import {
  Avatar,
  Card,
  EmptyState,
  Fab,
  Icon,
  IconButton,
  SectionHeader,
  Typography,
} from '@/components/ui';
import { TaskItem, useTaskActions } from '@/features/tasks';
import { ROUTES } from '@/lib/routes';
import { colors, radius, spacing, tones } from '@/theme';
import { useWeeklyDashboard } from '../hooks/use-weekly-dashboard';
import { ClassCard } from './ClassCard';
import { InspirationCard } from './InspirationCard';
import { WeekStrip } from './WeekStrip';

export function WeeklyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useSessionStore(selectCurrentUser);
  const period = getGreetingPeriod();
  const greetingKey = `home.greeting.${period}` as const;

  const {
    weekDays,
    selectedDate,
    selectDate,
    classes,
    tasks,
    tagsFor,
    isLoading,
    refetch,
  } = useWeeklyDashboard();

  const { toggle, edit, confirmDelete } = useTaskActions();

  const pendingCount = tasks.filter((task) => !task.completed).length;

  return (
    <ScreenContainer
      refreshing={isLoading}
      onRefresh={refetch}
      overlay={
        <Fab
          icon="add"
          accessibilityLabel={t('tasks.editor.createTitle')}
          onPress={() => router.push(ROUTES.newTask)}
        />
      }
    >
      {/* Header chào mừng */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Typography variant="displayLg">
            {t(greetingKey, { name: user?.displayName ?? 'Cô giáo' })}
          </Typography>
          <Typography variant="bodySm" color={colors.onSurfaceVariant}>
            {t('home.subtitle')}
          </Typography>
        </View>
        <Avatar
          name={user?.displayName ?? 'CT'}
          size={48}
          accessibilityLabel={user?.displayName ?? 'Avatar'}
        />
      </View>

      {/* Tóm tắt trọng tâm hôm nay (Today's Focus) */}
      <View style={styles.focusRow}>
        <Card variant="tonal" tone="blue" style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <Icon name="school" size={20} color={tones.blue.fg} />
            <View style={[styles.badge, { backgroundColor: tones.blue.accent }]}>
              <Typography variant="labelSm" color={tones.blue.fg}>
                {t('home.scheduleBadge')}
              </Typography>
            </View>
          </View>
          <Typography variant="displayLg" color={tones.blue.fg}>
            {classes.length}
          </Typography>
          <Typography variant="labelMd" color={tones.blue.fg}>
            {t('home.classesToday').replace('\n', ' ')}
          </Typography>
        </Card>

        <Card variant="tonal" tone="pink" style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <Icon name="checklist" size={20} color={tones.pink.fg} />
            <View style={[styles.badge, { backgroundColor: tones.pink.accent }]}>
              <Typography variant="labelSm" color={tones.pink.fg}>
                {t('home.todoBadge')}
              </Typography>
            </View>
          </View>
          <Typography variant="displayLg" color={tones.pink.fg}>
            {pendingCount}
          </Typography>
          <Typography variant="labelMd" color={tones.pink.fg}>
            {t('home.pendingTasks').replace('\n', ' ')}
          </Typography>
        </Card>
      </View>

      {/* Dải chọn ngày trong tuần */}
      <View style={styles.section}>
        <SectionHeader title={t('weekly.title')} />
        <WeekStrip days={weekDays} selectedDate={selectedDate} onSelect={selectDate} />
      </View>

      {/* Danh sách lớp dạy */}
      <View style={styles.section}>
        <SectionHeader
          title={t('weekly.teachingClasses')}
          trailing={
            <IconButton
              icon="calendar"
              accessibilityLabel={t('navigation.calendar')}
              onPress={() => router.push(ROUTES.calendar)}
            />
          }
        />
        {classes.length === 0 ? (
          <EmptyState
            icon="school"
            title={t('weekly.noClasses')}
          />
        ) : (
          <View style={styles.list}>
            {classes.map((cls) => (
              <ClassCard key={cls.id} session={cls} />
            ))}
          </View>
        )}
      </View>

      {/* Danh sách việc cá nhân */}
      <View style={styles.section}>
        <SectionHeader
          title={t('weekly.personalTodos')}
          trailing={
            <IconButton
              icon="add"
              accessibilityLabel={t('weekly.addPersonalTask')}
              onPress={() => router.push(ROUTES.newTask)}
            />
          }
        />
        {tasks.length === 0 ? (
          <EmptyState
            icon="checklist"
            title={t('weekly.noTodos')}
          />
        ) : (
          <View style={styles.list}>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                tags={tagsFor(task.tagIds)}
                onToggle={toggle}
                onEdit={edit}
                onDelete={confirmDelete}
              />
            ))}
          </View>
        )}
      </View>

      {/* Trích dẫn hàng ngày */}
      <InspirationCard />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[2],
  },
  headerText: {
    flex: 1,
    gap: spacing[1],
    paddingRight: spacing[4],
  },
  focusRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  focusCard: {
    flex: 1,
    padding: spacing[4],
    gap: spacing[2],
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
  },
  section: {
    gap: spacing[3],
  },
  list: {
    gap: spacing[3],
  },
});
