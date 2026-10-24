'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Button, Icon, TextField } from '@/components/ui';
import { useFieldErrorText } from '@/hooks';
import { useForgotPasswordForm } from '../hooks/use-forgot-password-form';

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const errorText = useFieldErrorText();
  const form = useForgotPasswordForm();
  const emailLabel = t('auth.reset.forgotEmailLabel');

  if (form.isSuccess) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div
          role="status"
          className="bg-secondary-container text-on-secondary-container text-body-md flex items-center gap-3 rounded-lg p-4 text-left"
        >
          <Icon name="check" size={24} />
          <span>{t('auth.reset.forgotSuccessNote')}</span>
        </div>

        <Link
          href={`/reset-password?email=${encodeURIComponent(form.email)}`}
          className="bg-primary text-on-primary hover:bg-primary/90 min-h-touch inline-flex items-center justify-center rounded-lg px-6 font-medium transition-colors"
        >
          {t('auth.reset.goToReset')} &rarr;
        </Link>

        <div className="flex items-center justify-center">
          <Link
            href="/login"
            className="text-primary hover:underline text-body-sm min-h-touch inline-flex items-center font-medium"
          >
            &larr; {t('auth.reset.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={form.submit} className="flex flex-col gap-5">
      <TextField
        label={emailLabel}
        type="email"
        autoComplete="email"
        inputMode="email"
        icon="email"
        placeholder={t('auth.reset.forgotEmailPlaceholder')}
        value={form.email}
        onChange={(e) => form.setEmail(e.target.value)}
        error={errorText(form.errors.email, emailLabel)}
        required
        autoFocus
      />

      {form.serverErrorKey && (
        <p role="alert" className="bg-error-container text-on-error-container text-body-sm flex items-center gap-2 rounded-md px-4 py-3">
          <Icon name="flag" size={18} />
          <span>{t(form.serverErrorKey)}</span>
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={form.isSubmitting}>
        {t('auth.reset.forgotSubmit')}
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
