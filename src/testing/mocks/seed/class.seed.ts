import type { ClassSession } from '@/types';
import { generateClassSessions } from '@/utils';
import type { SeedContext } from './seed-context';
import { seedAdhocSessions, seedSessionOverrides, seedTimetableSlots } from './timetable.seed';

/** Generates class sessions for the current week (Monday to Sunday) based on timetable slots. */
export const seedClasses = (context: SeedContext): ClassSession[] => {
  const from = context.weekday(0); // Monday
  const to = context.weekday(6); // Sunday
  const slots = seedTimetableSlots();
  const overrides = seedSessionOverrides(context);
  const adhoc = seedAdhocSessions(context);
  return generateClassSessions(slots, overrides, adhoc, from, to);
};
