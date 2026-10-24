'use client';

import { useState, type FormEvent } from 'react';
import { useForgotPassword } from '../api';
import { forgotPasswordSchema, validate, type FieldErrors, type ForgotPasswordFormValues } from '@/utils';
import type { TranslationKey } from '@/lib/i18n';
import type { ApiErrorCode } from '@/lib/api';

export function useForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors<ForgotPasswordFormValues>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const forgotMutation = useForgotPassword();

  const handleSetEmail = (nextEmail: string) => {
    setEmail(nextEmail);
    setErrors((current) => ({ ...current, email: undefined }));
    if (forgotMutation.isError) forgotMutation.reset();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validate(forgotPasswordSchema, { email });
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    forgotMutation.mutate(result.data.email, {
      onSuccess: () => {
        setIsSuccess(true);
      },
    });
  };

  const serverErrorKey: TranslationKey | undefined = forgotMutation.error?.messageKey;
  const serverErrorCode: ApiErrorCode | undefined = forgotMutation.error?.code;

  return {
    email,
    setEmail: handleSetEmail,
    errors,
    submit,
    isSuccess,
    isSubmitting: forgotMutation.isPending,
    serverErrorKey,
    serverErrorCode,
  };
}
