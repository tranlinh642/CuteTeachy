'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Button, Icon, IconButton, TextField } from '@/components/ui';
import { useFieldErrorText } from '@/hooks';
import { useResetPasswordForm } from '../hooks/use-reset-password-form';
import { CodeInput } from './CodeInput';

export interface ResetPasswordFormProps {
  readonly initialEmail?: string;
}

export function ResetPasswordForm({ initialEmail = '' }: ResetPasswordFormProps) {
  const { t } = useTranslation();
  const errorText = useFieldErrorText();
  const form = useResetPasswordForm({ initialEmail });

  const emailLabel = t('auth.reset.forgotEmailLabel');
  const codeLabel = t('auth.reset.codeLabel');
  const newPasswordLabel = t('auth.reset.newPasswordLabel');
  const confirmPasswordLabel = t('auth.reset.confirmPasswordLabel');

  return (
    <form noValidate onSubmit={form.submit} className="flex flex-col gap-5">
      {!initialEmail ? (
        <TextField
          label={emailLabel}
          type="email"
          autoComplete="email"
          inputMode="email"
          icon="email"
          placeholder={t('auth.reset.forgotEmailPlaceholder')}
          value={form.values.email}
          onChange={(e) => form.setField('email', e.target.value)}
          error={errorText(form.errors.email, emailLabel)}
          required
        />
      ) : (
        <div className="bg-surface-container-low rounded-lg p-3 text-center">
          <p className="text-body-sm text-on-surface-variant">
            {t('auth.verify.subtitle', { email: initialEmail })}
          </p>
        </div>
      )}

      <CodeInput
        label={codeLabel}
        value={form.values.code}
        onChange={(val) => form.setField('code', val)}
        error={errorText(form.errors.code, codeLabel)}
        autoFocus={Boolean(initialEmail)}
      />

      <div className="flex items-center justify-between text-body-sm -mt-2">
        <span className="text-on-surface-variant">
          {form.canResend
            ? ''
            : t('auth.reset.resendCountdown', { seconds: form.secondsLeft })}
        </span>
        <button
          type="button"
          onClick={form.resendCode}
          disabled={!form.canResend || form.isResending || !form.values.email}
          className="text-primary hover:underline disabled:text-on-surface-variant/50 min-h-touch inline-flex items-center font-medium disabled:no-underline disabled:cursor-not-allowed"
        >
          {form.isResending ? t('common.states.loading') : t('auth.reset.resendButton')}
        </button>
      </div>

      {form.resendSuccess && (
        <p role="status" className="bg-secondary-container text-on-secondary-container text-body-sm flex items-center gap-2 rounded-md px-4 py-3">
          <Icon name="check" size={18} />
          <span>{t('auth.reset.resendSuccess')}</span>
        </p>
      )}

      <TextField
        label={newPasswordLabel}
        type={form.showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        icon="lock"
        placeholder={t('auth.reset.newPasswordPlaceholder')}
        value={form.values.newPassword}
        onChange={(e) => form.setField('newPassword', e.target.value)}
        error={errorText(form.errors.newPassword, newPasswordLabel)}
        required
        trailing={
          <IconButton
            icon={form.showPassword ? 'visibilityOff' : 'visibility'}
            aria-label={
              form.showPassword
                ? t('auth.reset.hidePassword')
                : t('auth.reset.showPassword')
            }
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
        placeholder={t('auth.reset.confirmPasswordPlaceholder')}
        value={form.values.confirmPassword}
        onChange={(e) => form.setField('confirmPassword', e.target.value)}
        error={errorText(form.errors.confirmPassword, confirmPasswordLabel)}
        required
        trailing={
          <IconButton
            icon={form.showConfirmPassword ? 'visibilityOff' : 'visibility'}
            aria-label={
              form.showConfirmPassword
                ? t('auth.reset.hideConfirmPassword')
                : t('auth.reset.showConfirmPassword')
            }
            aria-pressed={form.showConfirmPassword}
            onClick={form.toggleShowConfirmPassword}
            className="-mr-2"
          />
        }
      />

      {form.serverErrorKey && (
        <p role="alert" className="bg-error-container text-on-error-container text-body-sm flex items-center gap-2 rounded-md px-4 py-3">
          <Icon name="flag" size={18} />
          <span>{t(form.serverErrorKey)}</span>
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={form.isSubmitting}>
        {t('auth.reset.submit')}
      </Button>

      <div className="flex items-center justify-center">
        <Link
          href="/login"
          className="text-primary hover:underline text-body-sm min-h-touch inline-flex items-center font-medium"
        >
          &larr; {t('auth.reset.backToLogin')}
        </Link>
      </div>
    </form>
  );
}
