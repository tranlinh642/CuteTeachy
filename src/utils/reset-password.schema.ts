import { z } from 'zod';
import { EMAIL_PATTERN, LIMITS } from './limits';

export const CODE_PATTERN = /^\d{6}$/;

export const verifyEmailSchema = z.object({
  email: z.string().trim().min(1, 'validation.required').regex(EMAIL_PATTERN, 'validation.email'),
  code: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .regex(CODE_PATTERN, 'auth.errors.invalidCode'),
});

export type VerifyEmailFormValues = z.input<typeof verifyEmailSchema>;
export type VerifyEmailFormOutput = z.output<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'validation.required').regex(EMAIL_PATTERN, 'validation.email'),
});

export type ForgotPasswordFormValues = z.input<typeof forgotPasswordSchema>;
export type ForgotPasswordFormOutput = z.output<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().min(1, 'validation.required').regex(EMAIL_PATTERN, 'validation.email'),
    code: z
      .string()
      .trim()
      .min(1, 'validation.required')
      .regex(CODE_PATTERN, 'auth.errors.invalidCode'),
    newPassword: z
      .string()
      .min(1, 'validation.required')
      .min(LIMITS.passwordMin, 'validation.minLength')
      .max(LIMITS.passwordMax, 'validation.maxLength'),
    confirmPassword: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'auth.reset.passwordMismatch',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.input<typeof resetPasswordSchema>;
export type ResetPasswordFormOutput = z.output<typeof resetPasswordSchema>;
