import type { pickers as Schema } from '../vi/pickers';

export const pickers: typeof Schema = {
  date: {
    title: 'Select date',
    placeholder: 'mm/dd/yyyy',
  },
  time: {
    title: 'Select time',
    placeholder: '--:--',
    hour: 'Hour',
    minute: 'Minute',
    am: 'AM',
    pm: 'PM',
    increase: 'Increase {{unit}}',
    decrease: 'Decrease {{unit}}',
  },
  month: {
    title: 'Select month',
  },
  year: {
    title: 'Select year',
    previousRange: 'Previous years',
    nextRange: 'Next years',
  },
  confirm: 'Done',
  clear: 'Clear value',
};
