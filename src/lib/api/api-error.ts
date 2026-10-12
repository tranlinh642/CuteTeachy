import type { TranslationKey } from '@/lib/i18n';
import { isAxiosError } from 'axios';

export type ApiErrorCode = 'network' | 'unauthorized' | 'not_found' | 'validation' | 'invalid_credentials' | 'unknown';

const CODE_TO_KEY: Readonly<Record<ApiErrorCode, TranslationKey>> = {
  network: 'errors.network',
  unauthorized: 'errors.unauthorized',
  not_found: 'errors.notFound',
  validation: 'errors.validation',
  invalid_credentials: 'auth.errors.invalidCredentials',
  unknown: 'errors.generic',
};

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

const statusToCode = (status: number, serverCode?: string): ApiErrorCode => {
  if (serverCode === 'invalid_credentials') return 'invalid_credentials';
  if (status === 401) return 'unauthorized';
  if (status === 404) return 'not_found';
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
