import { useState } from 'react';
import { MOCK_DEMO_CREDENTIALS, useLogin } from '@cute-teachy/api';
import { loginSchema, validate, type FieldErrors, type LoginFormValues } from '@cute-teachy/core';
import { useTranslation, type TranslationKey } from '@cute-teachy/i18n';
import { translateFieldError } from '@/lib/field-error';

type LoginField = keyof LoginFormValues;

const FIELD_LABELS: Readonly<Record<'email' | 'password', TranslationKey>> = {
  email: 'auth.login.emailLabel',
  password: 'auth.login.passwordLabel',
};

const INITIAL_VALUES: LoginFormValues = { email: '', password: '', remember: true };

/** View-model màn hình đăng nhập: state form, validate (zod), gọi API. */
export function useLoginForm() {
  const { t } = useTranslation();
  const login = useLogin();
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors<LoginFormValues>>({});

  const setField = <K extends LoginField>(field: K, value: LoginFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = () => {
    const result = validate(loginSchema, values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    login.mutate(result.data); // thành công → session store cập nhật → Stack.Protected chuyển sang tabs
  };

  const fillDemo = () => {
    setValues({ ...MOCK_DEMO_CREDENTIALS, remember: true });
    setErrors({});
  };

  return {
    values,
    setField,
    submit,
    fillDemo,
    isSubmitting: login.isPending,
    emailError: translateFieldError(t, errors.email, FIELD_LABELS.email),
    passwordError: translateFieldError(t, errors.password, FIELD_LABELS.password),
    submitError: login.error ? t(login.error.messageKey) : undefined,
    demoHint: t('auth.login.demoHint', MOCK_DEMO_CREDENTIALS),
  };
}
