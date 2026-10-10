'use client';

import { MOCK_DEMO_CREDENTIALS, useLogin } from '@cute-teachy/api';
import { loginSchema, validate, type FieldErrors, type LoginFormValues } from '@cute-teachy/core';
import type { TranslationKey } from '@cute-teachy/i18n';
import { useState, type FormEvent } from 'react';

export interface LoginFormState {
  readonly email: string;
  readonly password: string;
  readonly remember: boolean;
}

const INITIAL_STATE: LoginFormState = { email: '', password: '', remember: true };

/** View-model form đăng nhập: validate bằng zod (core) rồi gọi `useLogin`. */
export function useLoginForm() {
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
    login.mutate(result.data);
  };

  const fillDemoCredentials = () => {
    setValues({ ...MOCK_DEMO_CREDENTIALS, remember: true });
    setErrors({});
  };

  const serverErrorKey: TranslationKey | undefined = login.error?.messageKey;

  return {
    values,
    errors,
    setField,
    showPassword,
    toggleShowPassword: () => setShowPassword((visible) => !visible),
    submit,
    isSubmitting: login.isPending,
    serverErrorKey,
    fillDemoCredentials,
  };
}
