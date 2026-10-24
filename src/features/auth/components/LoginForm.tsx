'use client';

import Link from 'next/link';
import { MOCK_DEMO_CREDENTIALS } from '../api';
import { useTranslation } from '@/lib/i18n';
import { Button, Checkbox, Icon, IconButton, TextField } from '@/components/ui';
import { isMockApi } from '@/config';
import { useFieldErrorText } from '@/hooks';
import { useLoginForm } from '../hooks/use-login-form';
import { GoogleLoginButton } from './GoogleLoginButton';

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
      <div className="flex items-center justify-between">
        <Checkbox
          checked={form.values.remember}
          onChange={(checked) => form.setField('remember', checked)}
          label={t('auth.login.remember')}
        />
        <Link
          href="/forgot-password"
          className="text-primary hover:underline text-body-sm font-medium"
        >
          {t('auth.login.forgotPassword')}
        </Link>
      </div>

      {form.serverErrorKey && (
        <div
          role="alert"
          className="bg-error-container text-on-error-container text-body-sm flex flex-col gap-2 rounded-md px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Icon name="flag" size={18} />
            <span>{t(form.serverErrorKey)}</span>
          </div>
          {form.serverErrorCode === 'email_not_verified' && (
            <Link
              href={`/verify-email?email=${encodeURIComponent(form.values.email)}`}
              className="text-primary hover:underline min-h-touch inline-flex items-center font-medium self-start"
            >
              {t('auth.verify.title')} &rarr;
            </Link>
          )}
        </div>
      )}

      <Button type="submit" size="lg" fullWidth loading={form.isSubmitting}>
        {t('auth.login.submit')}
      </Button>

      <div className="relative my-1 flex items-center justify-center">
        <div className="border-outline-variant/60 absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <span className="bg-tertiary-container/40 text-on-surface-variant text-body-sm relative px-3">
          {t('auth.google.or')}
        </span>
      </div>

      <GoogleLoginButton remember={form.values.remember} />

      <div className="flex items-center justify-center gap-1 text-body-sm text-on-surface-variant">
        <span>{t('auth.login.noAccount')}</span>
        <Link
          href="/register"
          className="text-primary hover:underline min-h-touch inline-flex items-center font-medium"
        >
          {t('auth.login.signUp')}
        </Link>
      </div>

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
