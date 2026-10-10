import { z } from 'zod';
import { isValidISODate } from '../date/date-parse';
import { LIMITS } from './limits';

export const checklistItemSchema = z.object({
  id: z.string(),
  text: z.string().trim().min(1, 'validation.required'),
  done: z.boolean(),
});

export const noteSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(LIMITS.titleMax, 'validation.maxLength'),
  content: z
    .string()
    .trim()
    .max(LIMITS.noteContentMax, 'validation.maxLength')
    .optional()
    .transform((value) => (value ? value : undefined)),
  checklist: z.array(checklistItemSchema).default([]),
  tagIds: z.array(z.string()).default([]),
  dueDate: z
    .string()
    .optional()
    .refine((value) => !value || isValidISODate(value), 'validation.invalidDate')
    .transform((value) => (value ? value : undefined)),
});

export type NoteFormValues = z.input<typeof noteSchema>;
export type NoteFormOutput = z.output<typeof noteSchema>;
