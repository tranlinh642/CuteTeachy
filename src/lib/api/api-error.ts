import type { TranslationKey } from '@/lib/i18n';
import { isAxiosError } from 'axios';

export type ApiErrorCode =
  | 'network'
  | 'unauthorized'
  | 'not_found'
  | 'validation'
  | 'invalid_credentials'
  | 'email_taken'
  | 'onboarding_required'
  | 'email_not_verified'
  | 'invalid_code'
  | 'file_too_large'
  | 'unsupported_file_type'
  | 'rate_limited'
  | 'gone'
  | 'id_conflict'
  | 'tag_name_taken'
  | 'timetable_conflict'
  | 'cannot_delete_generated_session'
  | 'conflict'
  | 'unknown';

const CODE_TO_KEY: Readonly<Record<ApiErrorCode, TranslationKey>> = {
  network: 'errors.network',
  unauthorized: 'errors.unauthorized',
  not_found: 'errors.notFound',
  validation: 'errors.validation',
  invalid_credentials: 'auth.errors.invalidCredentials',
  email_taken: 'auth.errors.emailTaken',
  onboarding_required: 'auth.errors.onboardingRequired',
  email_not_verified: 'auth.errors.emailNotVerified',
  invalid_code: 'auth.errors.invalidCode',
  file_too_large: 'errors.fileTooLarge',
  unsupported_file_type: 'errors.unsupportedFileType',
  rate_limited: 'errors.rateLimited',
  gone: 'errors.gone',
  id_conflict: 'errors.idConflict',
  tag_name_taken: 'errors.tagNameTaken',
  timetable_conflict: 'errors.timetableConflict',
  cannot_delete_generated_session: 'classSession.cannotDeleteGenerated',
  conflict: 'errors.generic',
  unknown: 'errors.generic',
};

const KNOWN_CODES = new Set<ApiErrorCode>([
  'network',
  'unauthorized',
  'not_found',
  'validation',
  'invalid_credentials',
  'email_taken',
  'onboarding_required',
  'email_not_verified',
  'invalid_code',
  'file_too_large',
  'unsupported_file_type',
  'rate_limited',
  'gone',
  'id_conflict',
  'tag_name_taken',
  'timetable_conflict',
  'cannot_delete_generated_session',
  'conflict',
]);

/** Normalised error thrown by every service call. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;

  constructor(code: ApiErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }

  /** i18n key to display: `t(error.messageKey)`. */
  get messageKey(): TranslationKey {
    return CODE_TO_KEY[this.code];
  }
}

export function isTimetableConflictError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'timetable_conflict';
}

export const isTagNameTakenError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    return error.code === 'tag_name_taken';
  }
  if (isAxiosError<{ code?: string }>(error)) {
    return error.response?.data?.code === 'tag_name_taken';
  }
  return false;
};

const statusToCode = (status: number, serverCode?: string): ApiErrorCode => {
  if (serverCode && KNOWN_CODES.has(serverCode as ApiErrorCode)) {
    return serverCode as ApiErrorCode;
  }
  if (status === 401) return 'unauthorized';
  if (status === 404) return 'not_found';
  if (status === 409) return 'email_taken';
  if (status === 410) return 'gone';
  if (status === 413) return 'file_too_large';
  if (status === 415) return 'unsupported_file_type';
  if (status === 429) return 'rate_limited';
  if (status === 400 || status === 422) return 'validation';
  return 'unknown';
};

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  if (isAxiosError<{ code?: string; message?: string }>(error)) {
    if (!error.response) return new ApiError('network', error.message);
    const { status, data } = error.response;
    return new ApiError(statusToCode(status, data?.code), data?.message ?? error.message, status);
  }
  return new ApiError('unknown', error instanceof Error ? error.message : String(error));
};
