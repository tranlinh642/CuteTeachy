'use client';

import type { FieldError } from '@/utils';
import { useTranslation } from '@/lib/i18n';
import { useCallback } from 'react';

/** Dịch lỗi validate (i18n key) kèm tên trường: "Vui lòng nhập Email". */
export function useFieldErrorText() {
  const { t } = useTranslation();
  return useCallback(
    (error: FieldError | undefined, fieldLabel: string): string | undefined =>
      error ? t(error.key, { field: fieldLabel, ...error.params }) : undefined,
    [t],
  );
}
