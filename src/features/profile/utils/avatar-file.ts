import type { TranslationKey } from '@/lib/i18n';

/** Maximum allowed avatar file size (2 MB) per SPEC-002 */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/** Allowed MIME types for avatar upload per SPEC-002 */
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type AllowedAvatarType = (typeof ALLOWED_AVATAR_TYPES)[number];

export type AvatarFileValidationError = 'file_too_large' | 'unsupported_file_type';

export interface AvatarValidationResult {
  readonly valid: boolean;
  readonly error?: AvatarFileValidationError;
  readonly errorKey?: TranslationKey;
}

/**
 * Validates avatar file before sending to API:
 * - Size must be <= 2 MB
 * - Type must be image/jpeg, image/png, or image/webp
 */
export function validateAvatarFile(file: { size: number; type: string }): AvatarValidationResult {
  if (file.size > MAX_AVATAR_BYTES) {
    return {
      valid: false,
      error: 'file_too_large',
      errorKey: 'errors.fileTooLarge',
    };
  }

  if (!ALLOWED_AVATAR_TYPES.includes(file.type as AllowedAvatarType)) {
    return {
      valid: false,
      error: 'unsupported_file_type',
      errorKey: 'errors.unsupportedFileType',
    };
  }

  return { valid: true };
}
