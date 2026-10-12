import type { TranslationKey, TranslationParams } from '@/lib/i18n';
import type { z } from 'zod';

/**
 * A validation error expressed as an i18n key, so web & mobile render it in
 * the current language: `t(error.key, { field: t(label), ...error.params })`.
 */
export interface FieldError {
  readonly key: TranslationKey;
  readonly params?: TranslationParams;
}

export type FieldErrors<T> = Partial<Record<Extract<keyof T, string>, FieldError>>;

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T; readonly errors?: undefined }
  | { readonly success: false; readonly data?: undefined; readonly errors: FieldErrors<T> };

const toParams = (issue: z.core.$ZodIssue): TranslationParams | undefined => {
  if (issue.code === 'too_small') return { count: Number(issue.minimum) };
  if (issue.code === 'too_big') return { count: Number(issue.maximum) };
  return undefined;
};

/** Runs a zod schema and maps the first issue of each field to a `FieldError`. */
export const validate = <S extends z.ZodType>(
  schema: S,
  input: unknown,
): ValidationResult<z.output<S>> => {
  const result = schema.safeParse(input);
  if (result.success) return { success: true, data: result.data };

  const errors: Record<string, FieldError> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? '_root');
    if (errors[field]) continue;
    errors[field] = { key: issue.message as TranslationKey, params: toParams(issue) };
  }
  return { success: false, errors: errors as FieldErrors<z.output<S>> };
};
