'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toApiError } from '@/lib/api';
import { useUpdateProfile } from '../api';
import {
  profileSchema,
  validate,
  type FieldErrors,
  type ProfileFormValues,
} from '@/utils';
import { selectCurrentUser, useSessionStore } from '@/stores';
import { useTranslation } from '@/lib/i18n';
import type { Gender } from '@/types';

export interface UseProfileFormProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

/**
 * View-model hook for web Profile Edit Dialog.
 * Manages form state, validation with profileSchema, submission, error handling,
 * and guards against background refetches wiping user inputs.
 */
export function useProfileForm({ open, onClose, onSuccess }: UseProfileFormProps) {
  const { t } = useTranslation();
  const user = useSessionStore(selectCurrentUser);
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [title, setTitle] = useState(user?.title ?? '');
  const [gender, setGender] = useState<Gender>(user?.gender ?? 'female');
  const [errors, setErrors] = useState<FieldErrors<ProfileFormValues>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setFullName(user?.fullName ?? '');
      setDisplayName(user?.displayName ?? '');
      setTitle(user?.title ?? '');
      setGender(user?.gender ?? 'female');
      setErrors({});
      setServerError(null);
    }
    prevOpenRef.current = open;
  }, [open, user]);

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
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setServerError(null);
    const result = validate(profileSchema, {
      fullName: fullName.trim(),
      displayName: displayName.trim(),
      title: title.trim(),
      gender,
    });

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    try {
      await updateProfile.mutateAsync(result.data);
      onSuccess?.();
      onClose();
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
