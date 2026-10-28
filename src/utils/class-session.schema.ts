import { z } from 'zod';
import { isValidISODate, isValidTime } from './date-parse';
import { LIMITS } from './limits';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, 'validation.maxLength')
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

export const TONE_ENUM = ['pink', 'blue', 'beige', 'lavender', 'rose', 'mint'] as const;

export const prepItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1, 'validation.required').max(LIMITS.titleMax, 'validation.maxLength'),
  done: z.boolean().default(false),
});

export const adhocSessionSchema = z
  .object({
    subject: z.string().trim().min(1, 'validation.required').max(LIMITS.titleMax, 'validation.maxLength'),
    grade: optionalText(60),
    room: optionalText(60),
    date: z.string().refine(isValidISODate, 'validation.invalidDate'),
    startTime: z.string().refine(isValidTime, 'validation.invalidTime'),
    endTime: z.string().refine(isValidTime, 'validation.invalidTime'),
    tone: z.enum(TONE_ENUM).default('mint'),
    topic: optionalText(200),
    prepItems: z.array(prepItemSchema).max(100, 'classSession.prepItemsMax').default([]),
  })
  .refine((data) => data.startTime < data.endTime, {
    path: ['endTime'],
    message: 'classSession.timeInvalid',
  });

export type AdhocSessionFormInput = z.input<typeof adhocSessionSchema>;
export type AdhocSessionFormOutput = z.output<typeof adhocSessionSchema>;
export type AdhocSessionFormValues = AdhocSessionFormInput;

export const sessionOverrideSchema = z.object({
  topic: optionalText(200),
  prepItems: z.array(prepItemSchema).max(100, 'classSession.prepItemsMax').optional(),
  cancelled: z.boolean().optional(),
});

export type SessionOverrideInput = z.input<typeof sessionOverrideSchema>;
export type SessionOverrideOutput = z.output<typeof sessionOverrideSchema>;
