'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Button, Checkbox, Icon, IconButton, TextField } from '@/components/ui';
import { useFieldErrorText } from '@/hooks';
import { useRegisterForm } from '../hooks/use-register-form';

/** Form đăng ký tài khoản (email, mật khẩu, xác nhận mật khẩu, ghi nhớ). */
export function RegisterForm() {
  const { t } = useTranslation();
  const errorText = useFieldErrorText();
  const form = useRegisterForm();

  const emailLabel = t('auth.register.emailLabel');
  const passwordLabel = t('auth.register.passwordLabel');
  const confirmPasswordLabel = t('auth.register.confirmPasswordLabel');

  return (
    <form noValidate onSubmit={form.submit} className="flex flex-col gap-5">
      <TextField
        label={emailLabel}
        type="email"
        autoComplete="email"
        inputMode="email"
        icon="email"
        placeholder={t('auth.register.emailPlaceholder')}
        value={form.values.email}
        onChange={(event) => form.setField('email', event.target.value)}
        error={errorText(form.errors.email, emailLabel)}
        required
      />

      <TextField
        label={passwordLabel}
        type={form.showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        icon="lock"
        placeholder={t('auth.register.passwordPlaceholder')}
        value={form.values.password}
        onChange={(event) => form.setField('password', event.target.value)}
        error={errorText(form.errors.password, passwordLabel)}
        required
        trailing={
          <IconButton
            icon={form.showPassword ? 'visibilityOff' : 'visibility'}
            aria-label={form.showPassword ? t('auth.register.hidePassword') : t('auth.register.showPassword')}
            aria-pressed={form.showPassword}
            onClick={form.toggleShowPassword}
            className="-mr-2"
          />
        }
      />

      <TextField
        label={confirmPasswordLabel}
        type={form.showConfirmPassword ? 'text' : 'password'}
        autoComplete="new-password"
        icon="lock"
        placeholder={t('auth.register.confirmPasswordPlaceholder')}
        value={form.values.confirmPassword}
        onChange={(event) => form.setField('confirmPassword', event.target.value)}
        error={errorText(form.errors.confirmPassword, confirmPasswordLabel)}
        required
        trailing={
          <IconButton
            icon={form.showConfirmPassword ? 'visibilityOff' : 'visibility'}
            aria-label={
              form.showConfirmPassword
                ? t('auth.register.hideConfirmPassword')
                : t('auth.register.showConfirmPassword')
            }
            aria-pressed={form.showConfirmPassword}
            onClick={form.toggleShowConfirmPassword}
            className="-mr-2"
          />
        }
      />

      <Checkbox
        checked={form.values.remember}
        onChange={(checked) => form.setField('remember', checked)}
        label={t('auth.register.remember')}
      />

      {form.serverErrorKey && (
        <div
          role="alert"
          className="bg-error-container text-on-error-container text-body-sm flex flex-col gap-2 rounded-md px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Icon name="flag" size={18} />
            <span>{t(form.serverErrorKey)}</span>
          </div>
          {form.serverErrorCode === 'email_taken' && (
            <Link
              href="/login"
              className="text-primary hover:underline min-h-touch inline-flex items-center font-medium self-start"
            >
              {t('auth.register.signInNow')} &rarr;
            </Link>
          )}
        </div>
      )}

      <Button type="submit" size="lg" fullWidth loading={form.isSubmitting}>
        {t('auth.register.submit')}
      </Button>

      <div className="flex items-center justify-center gap-1 text-body-sm text-on-surface-variant">
        <span>{t('auth.register.hasAccount')}</span>
        <Link
          href="/login"
          className="text-primary hover:underline min-h-touch inline-flex items-center font-medium"
        >
          {t('auth.register.signIn')}
        </Link>
      </div>
    </form>
  );
}
