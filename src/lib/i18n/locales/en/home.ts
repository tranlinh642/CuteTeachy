import type { home as Schema } from '../vi/home';

export const home: typeof Schema = {
  greeting: {
    morning: 'Good morning, {{name}}!',
    afternoon: 'Good afternoon, {{name}}!',
    evening: 'Good evening, {{name}}!',
  },
  subtitle: "Let's make today wonderful.",
  todaysFocus: "Today's Focus",
  classesToday: 'Classes\nToday',
  pendingTasks: 'Pending\nTasks',
  scheduleBadge: 'Schedule',
  todoBadge: 'To Do',
  quickNote: 'Quick\nNote',
  quickTask: 'Quick\nTask',
  dailyInspiration: 'Daily Inspiration',
};
