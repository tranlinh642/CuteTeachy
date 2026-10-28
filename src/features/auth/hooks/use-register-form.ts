'use client';

import { useRegister } from '../api';
import { registerSchema, validate, type FieldErrors, type RegisterFormValues } from '@/utils';
import type { ApiErrorCode } from '@/lib/api';
import type { TranslationKey } from '@/lib/i18n';
import { useState, type FormEvent } from 'react';

export interface RegisterFormState {
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly remember: boolean;
}

const INITIAL_STATE: RegisterFormState = {
  email: '',
  password: '',
  confirmPassword: '',
  remember: true,
};

/** View-model form đăng ký: validate bằng zod (core) rồi gọi `useRegister`. */
export function useRegisterForm() {
  const register = useRegister();
  const [values, setValues] = useState<RegisterFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors<RegisterFormValues>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const setField = <K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (register.isError) register.reset();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validate(registerSchema, values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    register.mutate({
      email: result.data.email,
      password: result.data.password,
      remember: result.data.remember,
    });
  };

  const serverErrorKey: TranslationKey | undefined = register.error?.messageKey;
  const serverErrorCode: ApiErrorCode | undefined = register.error?.code;

  return {
    values,
    errors,
    setField,
    showPassword,
    toggleShowPassword: () => setShowPassword((visible) => !visible),
    showConfirmPassword,
    toggleShowConfirmPassword: () => setShowConfirmPassword((visible) => !visible),
    submit,
    isSubmitting: register.isPending,
    serverErrorKey,
    serverErrorCode,
  };
}
