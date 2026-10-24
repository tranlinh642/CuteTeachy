'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toApiError } from '@/lib/api';
import { useUpdateProfile } from '@/features/profile';
import { selectCurrentUser, useSessionStore } from '@/stores';
import { useTranslation } from '@/lib/i18n';
import type { Gender } from '@/types';
import {
  getInitialOnboardingValues,
  validateOnboardingValues,
  type OnboardingFieldErrors,
} from '../utils/onboarding-helpers';

export interface UseOnboardingFormProps {
  readonly onSuccess?: () => void;
}

export function useOnboardingForm({ onSuccess }: UseOnboardingFormProps = {}) {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useSessionStore(selectCurrentUser);
  const updateProfile = useUpdateProfile();

  const initial = getInitialOnboardingValues(user);
  const [fullName, setFullName] = useState(initial.fullName);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [title, setTitle] = useState(initial.title);
  const [gender, setGender] = useState<Gender | null>(initial.gender);
  const [errors, setErrors] = useState<OnboardingFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.fullName && !fullName) {
      setFullName(user.fullName);
    }
    if (user?.displayName && !displayName) {
      setDisplayName(user.displayName);
    }
    if (user?.title && !title) {
      setTitle(user.title);
    }
  }, [user, fullName, displayName, title]);

  const handleFullNameChange = (value: string) => {
    setFullName(value);
    if (errors.fullName) setErrors((errs) => ({ ...errs, fullName: undefined }));
  };

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    if (errors.displayName) setErrors((errs) => ({ ...errs, displayName: undefined }));
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (errors.title) setErrors((errs) => ({ ...errs, title: undefined }));
  };

  const handleGenderChange = (val: Gender) => {
    setGender(val);
    if (errors.gender) setErrors((errs) => ({ ...errs, gender: undefined }));
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setServerError(null);

    const result = validateOnboardingValues({
      fullName,
      displayName,
      title,
      gender,
    });

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    try {
      await updateProfile.mutateAsync(result.data);
      onSuccess?.();
      router.replace('/');
    } catch (err) {
      const apiErr = toApiError(err);
      setServerError(t(apiErr.messageKey));
    }
  };

  return {
    fullName,
    displayName,
    title,
    gender,
    errors,
    serverError,
    isSubmitting: updateProfile.isPending,
    setFullName: handleFullNameChange,
    setDisplayName: handleDisplayNameChange,
    setTitle: handleTitleChange,
    setGender: handleGenderChange,
    submit: handleSubmit,
  };
}
