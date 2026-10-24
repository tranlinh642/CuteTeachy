'use client';

import { useTranslation } from '@/lib/i18n';
import { Button, TextField } from '@/components/ui';
import { useFieldErrorText } from '@/hooks';
import { useOnboardingForm } from '../hooks/use-onboarding-form';
import { GenderSelector, type GenderOption } from './GenderSelector';

export interface OnboardingFormProps {
  readonly onSuccess?: () => void;
}

export function OnboardingForm({ onSuccess }: OnboardingFormProps) {
  const { t } = useTranslation();
  const formatError = useFieldErrorText();

  const {
    fullName,
    displayName,
    title,
    gender,
    errors,
    serverError,
    isSubmitting,
    setFullName,
    setDisplayName,
    setTitle,
    setGender,
    submit,
  } = useOnboardingForm({ onSuccess });

  const genderOptions: readonly GenderOption[] = [
    { value: 'female', label: t('onboarding.genders.female') },
    { value: 'male', label: t('onboarding.genders.male') },
    { value: 'other', label: t('onboarding.genders.other') },
  ];

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {serverError && (
        <div
          role="alert"
          className="rounded-lg bg-error-container/60 p-3 text-body-sm text-on-error-container"
        >
          {serverError}
        </div>
      )}

      <TextField
        label={t('onboarding.fullNameLabel')}
        placeholder={t('onboarding.fullNamePlaceholder')}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={formatError(errors.fullName, t('onboarding.fullNameLabel'))}
        icon="person"
        autoFocus
      />

      <TextField
        label={t('onboarding.displayNameLabel')}
        placeholder={t('onboarding.displayNamePlaceholder')}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        error={formatError(errors.displayName, t('onboarding.displayNameLabel'))}
        hint={t('onboarding.displayNameHint')}
        icon="person"
      />

      <TextField
        label={t('onboarding.titleLabel')}
        placeholder={t('onboarding.titlePlaceholder')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={formatError(errors.title, t('onboarding.titleLabel'))}
        icon="school"
      />

      <GenderSelector
        label={t('onboarding.genderLabel')}
        hint={t('onboarding.genderHint')}
        options={genderOptions}
        value={gender}
        onChange={setGender}
        error={formatError(errors.gender, t('onboarding.genderLabel'))}
      />

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
        >
          {t('onboarding.submit')}
        </Button>
      </div>
    </form>
  );
}
