import { describe, expect, it } from 'vitest';
import { ApiError, isTagNameTakenError, toApiError, type ApiErrorCode } from './api-error';
import { AxiosError, AxiosHeaders } from 'axios';

describe('ApiError and toApiError', () => {
  it('returns same instance if error is already ApiError', () => {
    const original = new ApiError('email_taken', 'Email is taken', 409);
    expect(toApiError(original)).toBe(original);
    expect(original.messageKey).toBe('auth.errors.emailTaken');
  });

  const testCases: Array<{ status: number; serverCode?: string; expectedCode: ApiErrorCode; expectedKey: string }> = [
    { status: 409, serverCode: 'email_taken', expectedCode: 'email_taken', expectedKey: 'auth.errors.emailTaken' },
    { status: 409, serverCode: 'id_conflict', expectedCode: 'id_conflict', expectedKey: 'errors.idConflict' },
    { status: 409, serverCode: 'tag_name_taken', expectedCode: 'tag_name_taken', expectedKey: 'errors.tagNameTaken' },
    { status: 409, serverCode: 'timetable_conflict', expectedCode: 'timetable_conflict', expectedKey: 'errors.timetableConflict' },
    { status: 400, serverCode: 'cannot_delete_generated_session', expectedCode: 'cannot_delete_generated_session', expectedKey: 'classSession.cannotDeleteGenerated' },
    { status: 409, serverCode: 'conflict', expectedCode: 'conflict', expectedKey: 'errors.generic' },
    { status: 410, expectedCode: 'gone', expectedKey: 'errors.gone' },
    { status: 410, serverCode: 'gone', expectedCode: 'gone', expectedKey: 'errors.gone' },
    { status: 403, serverCode: 'onboarding_required', expectedCode: 'onboarding_required', expectedKey: 'auth.errors.onboardingRequired' },
    { status: 403, serverCode: 'email_not_verified', expectedCode: 'email_not_verified', expectedKey: 'auth.errors.emailNotVerified' },
    { status: 401, serverCode: 'invalid_code', expectedCode: 'invalid_code', expectedKey: 'auth.errors.invalidCode' },
    { status: 413, serverCode: 'file_too_large', expectedCode: 'file_too_large', expectedKey: 'errors.fileTooLarge' },
    { status: 415, serverCode: 'unsupported_file_type', expectedCode: 'unsupported_file_type', expectedKey: 'errors.unsupportedFileType' },
    { status: 429, serverCode: 'rate_limited', expectedCode: 'rate_limited', expectedKey: 'errors.rateLimited' },
    { status: 401, serverCode: 'invalid_credentials', expectedCode: 'invalid_credentials', expectedKey: 'auth.errors.invalidCredentials' },
    { status: 401, serverCode: 'unauthorized', expectedCode: 'unauthorized', expectedKey: 'errors.unauthorized' },
    { status: 404, expectedCode: 'not_found', expectedKey: 'errors.notFound' },
    { status: 400, expectedCode: 'validation', expectedKey: 'errors.validation' },
    { status: 500, expectedCode: 'unknown', expectedKey: 'errors.generic' },
  ];

  testCases.forEach(({ status, serverCode, expectedCode, expectedKey }) => {
    it(`correctly maps status ${status} with serverCode ${serverCode} to ${expectedCode}`, () => {
      const axiosError = new AxiosError(
        'Request failed',
        'ERR_BAD_REQUEST',
        undefined,
        {},
        {
          data: { code: serverCode, message: 'Custom message' },
          status,
          statusText: 'Error',
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      );
      const apiError = toApiError(axiosError);
      expect(apiError.code).toBe(expectedCode);
      expect(apiError.messageKey).toBe(expectedKey);
      expect(apiError.status).toBe(status);
    });
  });

  describe('isTagNameTakenError', () => {
    it('detects tag_name_taken in ApiError', () => {
      const error = new ApiError('tag_name_taken', 'Tag name is taken', 409);
      expect(isTagNameTakenError(error)).toBe(true);
    });

    it('detects tag_name_taken in AxiosError', () => {
      const axiosError = new AxiosError(
        'Conflict',
        'ERR_BAD_REQUEST',
        undefined,
        {},
        {
          data: { code: 'tag_name_taken' },
          status: 409,
          statusText: 'Conflict',
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      );
      expect(isTagNameTakenError(axiosError)).toBe(true);
    });

    it('returns false for other errors', () => {
      const otherError = new ApiError('validation', 'Invalid input', 400);
      expect(isTagNameTakenError(otherError)).toBe(false);
      expect(isTagNameTakenError(new Error('general error'))).toBe(false);
    });
  });
});
