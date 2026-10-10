import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from '@cute-teachy/i18n';
import { ScreenContainer } from '@/components/layout';
import { CalendarGrid, MonthNavigator } from '@/components/pickers';
import { Card, EmptyState, Fab, SectionHeader } from '@/components/ui';
import { TaskItem, useTaskActions } from '@/features/tasks';
import { ClassCard } from '@/features/weekly';
import { ROUTES } from '@/lib/routes';
import { spacing } from '@/theme';
import { useCalendarView } from '../hooks/use-calendar-view';

export function CalendarScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    year,
    monthIndex,
    monthTitle,
    selectedDate,
    selectedDateLabel,
    selectDate,
    nextMonth,
    previousMonth,
    markers,
    agenda,
    tagsFor,
    isLoading,
    refetch,
  } = useCalendarView();

  const { toggle, edit, confirmDelete } = useTaskActions();

  return (
    <ScreenContainer
      refreshing={isLoading}
      onRefresh={refetch}
      overlay={
        <Fab
          icon="add"
          accessibilityLabel={t('tasks.editor.createTitle')}
          onPress={() => router.push({ pathname: ROUTES.newTask, params: { date: selectedDate } })}
        />
      }
    >
      {/* Bộ điều hướng tháng */}
      <MonthNavigator
        title={monthTitle}
        onPrevious={previousMonth}
        onNext={nextMonth}
      />

      {/* Lưới lịch tháng */}
      <Card style={styles.calendarCard}>
        <CalendarGrid
          year={year}
          monthIndex={monthIndex}
          selectedDate={selectedDate}
          onSelectDate={selectDate}
          markers={markers}
        />
      </Card>

      {/* Lịch trình trong ngày đang chọn */}
      <View style={styles.section}>
        <SectionHeader title={selectedDateLabel} />

        {agenda.length === 0 ? (
          <EmptyState
            icon="calendar"
            title={t('calendar.noEvents')}
          />
        ) : (
          <View style={styles.agendaList}>
            {agenda.map((entry) => {
              if (entry.kind === 'class') {
                return <ClassCard key={`class-${entry.id}`} session={entry.item} />;
              }
              return (
                <TaskItem
                  key={`task-${entry.id}`}
                  task={entry.item}
                  tags={tagsFor(entry.item.tagIds)}
                  onToggle={toggle}
                  onEdit={edit}
                  onDelete={confirmDelete}
                />
              );
            })}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    padding: spacing[3],
  },
  section: {
    gap: spacing[3],
  },
  agendaList: {
    gap: spacing[3],
  },
});
