'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useResendVerificationCode, useResetPassword } from '../api';
import { useResendCountdown } from './use-resend-countdown';
import { resetPasswordSchema, validate, type FieldErrors, type ResetPasswordFormValues } from '@/utils';
import type { TranslationKey } from '@/lib/i18n';
import type { ApiErrorCode } from '@/lib/api';

export interface UseResetPasswordFormProps {
  readonly initialEmail?: string;
}

export interface ResetPasswordFormState {
  readonly email: string;
  readonly code: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
}

export function useResetPasswordForm({ initialEmail = '' }: UseResetPasswordFormProps = {}) {
  const router = useRouter();
  const [values, setValues] = useState<ResetPasswordFormState>({
    email: initialEmail,
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FieldErrors<ResetPasswordFormValues>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const resetMutation = useResetPassword();
  const resendMutation = useResendVerificationCode();
  const countdown = useResendCountdown({ initialSeconds: 60, autoStart: false });

  const setField = <K extends keyof ResetPasswordFormState>(key: K, value: ResetPasswordFormState[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (resetMutation.isError) resetMutation.reset();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validate(resetPasswordSchema, values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    resetMutation.mutate(
      {
        email: result.data.email,
        code: result.data.code,
        newPassword: result.data.newPassword,
      },
      {
        onSuccess: () => {
          router.replace('/login?reset=success');
        },
      },
    );
  };

  const resendCode = () => {
    if (!values.email || !countdown.canResend || resendMutation.isPending) return;
    setResendSuccess(false);
    resendMutation.mutate(values.email, {
      onSuccess: () => {
        setResendSuccess(true);
        countdown.start(60);
      },
    });
  };

  const serverErrorKey: TranslationKey | undefined =
    resetMutation.error?.messageKey ?? resendMutation.error?.messageKey;
  const serverErrorCode: ApiErrorCode | undefined =
    resetMutation.error?.code ?? resendMutation.error?.code;

  return {
    values,
    setField,
    errors,
    showPassword,
    toggleShowPassword: () => setShowPassword((visible) => !visible),
    showConfirmPassword,
    toggleShowConfirmPassword: () => setShowConfirmPassword((visible) => !visible),
    submit,
    resendCode,
    resendSuccess,
    isSubmitting: resetMutation.isPending,
    isResending: resendMutation.isPending,
    secondsLeft: countdown.secondsLeft,
    canResend: countdown.canResend,
    serverErrorKey,
    serverErrorCode,
  };
}
