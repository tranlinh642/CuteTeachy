import type { FieldError } from '@cute-teachy/core';
import type { TranslateFn, TranslationKey } from '@cute-teachy/i18n';

/**
 * Dịch lỗi validate (i18n key từ `@cute-teachy/core`) thành câu hiển thị,
 * chèn tên trường đã dịch vào `{{field}}`.
 */
export const translateFieldError = (
  t: TranslateFn,
  error: FieldError | undefined,
  fieldLabelKey: TranslationKey,
): string | undefined => (error ? t(error.key, { field: t(fieldLabelKey), ...error.params }) : undefined);
