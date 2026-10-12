import type { ISODate } from '@/types';

/** Inclusive date range used by list endpoints (`?from=&to=`). */
export interface DateRange {
  readonly from: ISODate;
  readonly to: ISODate;
}
