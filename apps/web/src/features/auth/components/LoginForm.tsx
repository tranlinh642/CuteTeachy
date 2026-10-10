'use client';

import { MOCK_DEMO_CREDENTIALS } from '@cute-teachy/api';
import { useTranslation } from '@cute-teachy/i18n';
import { Button, Checkbox, Icon, IconButton, TextField } from '@/components/ui';
import { isMockApi } from '@/lib/api-config';
import { useFieldErrorText } from '@/lib/use-field-error-text';
import { useLoginForm } from '../hooks/use-login-form';

/** Form đăng nhập (email + mật khẩu) – lỗi gắn với từng trường. */
export function LoginForm() {
  const { t } = useTranslation();
  const errorText = useFieldErrorText();
  const form = useLoginForm();
  const emailLabel = t('auth.login.emailLabel');
  const passwordLabel = t('auth.login.passwordLabel');

  return (
    <form noValidate onSubmit={form.submit} className="flex flex-col gap-5">
      <TextField
        label={emailLabel}
        type="email"
        autoComplete="email"
        inputMode="email"
        icon="email"
        placeholder={t('auth.login.emailPlaceholder')}
        value={form.values.email}
        onChange={(event) => form.setField('email', event.target.value)}
        error={errorText(form.errors.email, emailLabel)}
        required
      />
      <TextField
        label={passwordLabel}
        type={form.showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        icon="lock"
        placeholder={t('auth.login.passwordPlaceholder')}
        value={form.values.password}
        onChange={(event) => form.setField('password', event.target.value)}
        error={errorText(form.errors.password, passwordLabel)}
        required
        trailing={
          <IconButton
            icon={form.showPassword ? 'visibilityOff' : 'visibility'}
            aria-label={form.showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
            aria-pressed={form.showPassword}
            onClick={form.toggleShowPassword}
            className="-mr-2"
          />
        }
      />
      <Checkbox
        checked={form.values.remember}
        onChange={(checked) => form.setField('remember', checked)}
        label={t('auth.login.remember')}
      />

      {form.serverErrorKey && (
        <p role="alert" className="bg-error-container text-on-error-container text-body-sm flex items-center gap-2 rounded-md px-4 py-3">
          <Icon name="flag" size={18} />
          {t(form.serverErrorKey)}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={form.isSubmitting}>
        {t('auth.login.submit')}
      </Button>

      {isMockApi && (
        <button
          type="button"
          onClick={form.fillDemoCredentials}
          className="text-body-sm text-on-surface-variant hover:text-primary min-h-touch rounded-md text-center underline underline-offset-4"
        >
          {t('auth.login.demoHint', MOCK_DEMO_CREDENTIALS)}
        </button>
      )}
    </form>
  );
}
