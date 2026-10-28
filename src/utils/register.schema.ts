import { z } from 'zod';
import { EMAIL_PATTERN, LIMITS } from './limits';

export const registerSchema = z
  .object({
    email: z.string().trim().min(1, 'validation.required').regex(EMAIL_PATTERN, 'validation.email'),
    password: z
      .string()
      .min(1, 'validation.required')
      .min(LIMITS.passwordMin, 'validation.minLength')
      .max(LIMITS.passwordMax, 'validation.maxLength'),
    confirmPassword: z.string().min(1, 'validation.required'),
    remember: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.register.passwordMismatch',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.input<typeof registerSchema>;
export type RegisterFormOutput = z.output<typeof registerSchema>;
