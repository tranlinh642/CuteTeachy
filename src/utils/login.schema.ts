import { z } from 'zod';
import { EMAIL_PATTERN, LIMITS } from './limits';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'validation.required').regex(EMAIL_PATTERN, 'validation.email'),
  password: z
    .string()
    .min(1, 'validation.required')
    .min(LIMITS.passwordMin, 'validation.minLength')
    .max(LIMITS.passwordMax, 'validation.maxLength'),
  remember: z.boolean().default(true),
});

export type LoginFormValues = z.input<typeof loginSchema>;
