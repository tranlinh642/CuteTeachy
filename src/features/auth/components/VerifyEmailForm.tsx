'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Button, Icon, TextField } from '@/components/ui';
import { useFieldErrorText } from '@/hooks';
import { useVerifyEmailForm } from '../hooks/use-verify-email-form';
import { CodeInput } from './CodeInput';

export interface VerifyEmailFormProps {
  readonly initialEmail?: string;
}

export function VerifyEmailForm({ initialEmail = '' }: VerifyEmailFormProps) {
  const { t } = useTranslation();
  const errorText = useFieldErrorText();
  const form = useVerifyEmailForm({ initialEmail });

  const emailLabel = t('auth.login.emailLabel');
  const codeLabel = t('auth.verify.codeLabel');

  return (
    <form noValidate onSubmit={form.submit} className="flex flex-col gap-5">
      {!initialEmail ? (
        <TextField
          label={emailLabel}
          type="email"
          autoComplete="email"
          inputMode="email"
          icon="email"
          placeholder={t('auth.login.emailPlaceholder')}
          value={form.email}
          onChange={(e) => form.setEmail(e.target.value)}
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
        value={form.code}
        onChange={form.setCode}
        error={errorText(form.errors.code, codeLabel)}
        autoFocus
      />

      <div className="flex items-center justify-between text-body-sm">
        <span className="text-on-surface-variant">
          {form.canResend
            ? ''
            : t('auth.verify.resendCountdown', { seconds: form.secondsLeft })}
        </span>
        <button
          type="button"
          onClick={form.resendCode}
          disabled={!form.canResend || form.isResending || !form.email}
          className="text-primary hover:underline disabled:text-on-surface-variant/50 min-h-touch inline-flex items-center font-medium disabled:no-underline disabled:cursor-not-allowed"
        >
          {form.isResending ? t('common.states.loading') : t('auth.verify.resendButton')}
        </button>
      </div>

      {form.resendSuccess && (
        <p role="status" className="bg-secondary-container text-on-secondary-container text-body-sm flex items-center gap-2 rounded-md px-4 py-3">
          <Icon name="check" size={18} />
          <span>{t('auth.verify.resendSuccess')}</span>
        </p>
      )}

      {form.serverErrorKey && (
        <p role="alert" className="bg-error-container text-on-error-container text-body-sm flex items-center gap-2 rounded-md px-4 py-3">
          <Icon name="flag" size={18} />
          <span>{t(form.serverErrorKey)}</span>
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={form.isSubmitting}>
        {t('auth.verify.submit')}
      </Button>

      <div className="flex items-center justify-center">
        <Link
          href="/login"
          className="text-primary hover:underline text-body-sm min-h-touch inline-flex items-center font-medium"
        >
          &larr; {t('auth.verify.backToLogin')}
        </Link>
      </div>
    </form>
  );
}
