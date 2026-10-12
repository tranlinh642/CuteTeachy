import { TASK_CATEGORIES, TASK_PRIORITIES } from '@/types';
import { z } from 'zod';
import { isValidISODate, isValidTime } from './date-parse';
import { LIMITS } from './limits';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, 'validation.maxLength')
    .optional()
    .transform((value) => (value ? value : undefined));

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(LIMITS.titleMax, 'validation.maxLength'),
  date: z.string().refine(isValidISODate, 'validation.invalidDate'),
  time: z
    .string()
    .optional()
    .refine((value) => !value || isValidTime(value), 'validation.invalidTime')
    .transform((value) => (value ? value : undefined)),
  category: z.enum(TASK_CATEGORIES),
  priority: z.enum(TASK_PRIORITIES).default('normal'),
  tagIds: z.array(z.string()).default([]),
  notes: optionalText(LIMITS.notesMax),
});

export type TaskFormValues = z.input<typeof taskSchema>;
export type TaskFormOutput = z.output<typeof taskSchema>;
