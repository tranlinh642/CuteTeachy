export type GreetingPeriod = 'morning' | 'afternoon' | 'evening';

/** Maps the current hour to a greeting (`home.greeting.<period>`). */
export const getGreetingPeriod = (date: Date = new Date()): GreetingPeriod => {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};
