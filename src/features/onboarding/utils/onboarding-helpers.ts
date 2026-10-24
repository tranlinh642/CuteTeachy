import type { Gender, User } from '@/types';
import {
  profileSchema,
  validate,
  type FieldErrors,
  type ProfileFormValues,
  type ValidationResult,
} from '@/utils';

export interface OnboardingFormValues {
  readonly fullName: string;
  readonly displayName: string;
  readonly title: string;
  readonly gender: Gender | null;
}

/**
 * Prefills initial form values from User object.
 * fullName and displayName are populated if available.
 * gender is strictly null (mandatory selection per SPEC-002).
 */
export function getInitialOnboardingValues(user?: User | null): OnboardingFormValues {
  return {
    fullName: user?.fullName ?? '',
    displayName: user?.displayName ?? '',
    title: user?.title ?? '',
    gender: null,
  };
}

/**
 * Validates onboarding input using the shared profileSchema.
 */
export function validateOnboardingValues(
  values: OnboardingFormValues,
): ValidationResult<ProfileFormValues> {
  return validate(profileSchema, {
    fullName: values.fullName.trim(),
    displayName: values.displayName.trim(),
    title: values.title.trim(),
    gender: values.gender as Gender,
  });
}

export type OnboardingFieldErrors = FieldErrors<ProfileFormValues>;
