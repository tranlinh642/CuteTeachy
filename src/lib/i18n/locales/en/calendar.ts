import type { calendar as Schema } from '../vi/calendar';

export const calendar: typeof Schema = {
  title: 'Calendar View',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  today: 'Today',
  noEvents: 'Nothing scheduled for this day',
  eventsCount: '{{count}} events',
  selectMonth: 'Select month',
  selectYear: 'Select year',
  filterAll: 'All',
  categories: {
    all: 'All',
    school_teaching: 'School class',
    extra_teaching: 'Extra tutoring',
    self_study: 'Self study',
  },
};
