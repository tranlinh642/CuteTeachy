'use client';

import { useState, type FormEvent } from 'react';
import { useResendVerificationCode, useVerifyEmail } from '../api';
import { useResendCountdown } from './use-resend-countdown';
import { validate, verifyEmailSchema, type FieldErrors, type VerifyEmailFormValues } from '@/utils';
import type { TranslationKey } from '@/lib/i18n';
import type { ApiErrorCode } from '@/lib/api';

export interface UseVerifyEmailFormProps {
  readonly initialEmail?: string;
  readonly autoStartCountdown?: boolean;
}

export function useVerifyEmailForm({
  initialEmail = '',
  autoStartCountdown = true,
}: UseVerifyEmailFormProps = {}) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<FieldErrors<VerifyEmailFormValues>>({});
  const [resendSuccess, setResendSuccess] = useState(false);

  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerificationCode();
  const countdown = useResendCountdown({ initialSeconds: 60, autoStart: autoStartCountdown });

  const handleSetCode = (nextCode: string) => {
    setCode(nextCode);
    setErrors((current) => ({ ...current, code: undefined }));
    if (verifyMutation.isError) verifyMutation.reset();
  };

  const handleSetEmail = (nextEmail: string) => {
    setEmail(nextEmail);
    setErrors((current) => ({ ...current, email: undefined }));
    if (verifyMutation.isError) verifyMutation.reset();
  };

  const submit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const result = validate(verifyEmailSchema, { email, code });
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    verifyMutation.mutate({
      email: result.data.email,
      code: result.data.code,
    });
  };

  const resendCode = () => {
    if (!email || !countdown.canResend || resendMutation.isPending) return;
    setResendSuccess(false);
    resendMutation.mutate(email, {
      onSuccess: () => {
        setResendSuccess(true);
        countdown.start(60);
      },
    });
  };

  const serverErrorKey: TranslationKey | undefined =
    verifyMutation.error?.messageKey ?? resendMutation.error?.messageKey;
  const serverErrorCode: ApiErrorCode | undefined =
    verifyMutation.error?.code ?? resendMutation.error?.code;

  return {
    email,
    setEmail: handleSetEmail,
    code,
    setCode: handleSetCode,
    errors,
    submit,
    resendCode,
    resendSuccess,
    isSubmitting: verifyMutation.isPending,
    isResending: resendMutation.isPending,
    secondsLeft: countdown.secondsLeft,
    canResend: countdown.canResend,
    serverErrorKey,
    serverErrorCode,
  };
}
