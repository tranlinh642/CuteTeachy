import { z } from 'zod';
import { isValidISODate, isValidTime } from './date-parse';

export const timetableSlotSchema = z
  .object({
    weekday: z.number().int().min(1, 'validation.invalidWeekday').max(7, 'validation.invalidWeekday'),
    startTime: z.string().refine(isValidTime, 'validation.invalidTime'),
    endTime: z.string().refine(isValidTime, 'validation.invalidTime'),
    subject: z.string().trim().min(1, 'validation.required').max(120, 'validation.maxLength'),
    grade: z
      .string()
      .trim()
      .max(60, 'validation.maxLength')
      .optional()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    room: z
      .string()
      .trim()
      .max(60, 'validation.maxLength')
      .optional()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    tone: z.enum(['pink', 'blue', 'beige', 'lavender', 'rose', 'mint']),
    effectiveFrom: z.string().refine(isValidISODate, 'validation.invalidDate'),
    effectiveTo: z
      .string()
      .optional()
      .refine((val) => !val || isValidISODate(val), 'validation.invalidDate')
      .transform((val) => (val && val.length > 0 ? val : undefined)),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'validation.startTimeBeforeEndTime',
    path: ['endTime'],
  })
  .refine(
    (data) => !data.effectiveTo || data.effectiveTo >= data.effectiveFrom,
    {
      message: 'validation.effectiveToAfterFrom',
      path: ['effectiveTo'],
    },
  );

export type TimetableSlotFormValues = z.input<typeof timetableSlotSchema>;
export type TimetableSlotFormOutput = z.output<typeof timetableSlotSchema>;
