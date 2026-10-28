'use client';

import { useRouter } from 'next/navigation';
import { MOCK_DEMO_CREDENTIALS, useLogin } from '../api';
import { loginSchema, validate, type FieldErrors, type LoginFormValues } from '@/utils';
import type { TranslationKey } from '@/lib/i18n';
import { useState, type FormEvent } from 'react';

export interface LoginFormState {
  readonly email: string;
  readonly password: string;
  readonly remember: boolean;
}

const INITIAL_STATE: LoginFormState = { email: '', password: '', remember: true };

/** View-model form đăng nhập: validate bằng zod (core) rồi gọi `useLogin`. */
export function useLoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [values, setValues] = useState<LoginFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors<LoginFormValues>>({});
  const [showPassword, setShowPassword] = useState(false);

  const setField = <K extends keyof LoginFormState>(key: K, value: LoginFormState[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (login.isError) login.reset();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validate(loginSchema, values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    login.mutate(result.data, {
      onError: (error) => {
        if (error.code === 'email_not_verified') {
          router.push(`/verify-email?email=${encodeURIComponent(result.data.email)}`);
        }
      },
    });
  };

  const fillDemoCredentials = () => {
    setValues({ ...MOCK_DEMO_CREDENTIALS, remember: true });
    setErrors({});
  };

  const serverErrorKey: TranslationKey | undefined = login.error?.messageKey;
  const serverErrorCode = login.error?.code;

  return {
    values,
    errors,
    setField,
    showPassword,
    toggleShowPassword: () => setShowPassword((visible) => !visible),
    submit,
    isSubmitting: login.isPending,
    serverErrorKey,
    serverErrorCode,
    fillDemoCredentials,
  };
}
