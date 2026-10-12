import { z } from 'zod';

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'validation.minLength').max(50, 'validation.maxLength'),
  displayName: z.string().trim().min(1, 'validation.required').max(20, 'validation.maxLength'),
  title: z
    .string()
    .trim()
    .max(50, 'validation.maxLength')
    .optional()
    .nullable()
    .or(z.literal('')),
  gender: z.enum(['female', 'male', 'other'], {
    message: 'validation.required',
  }),
});

export type ProfileFormValues = z.input<typeof profileSchema>;
