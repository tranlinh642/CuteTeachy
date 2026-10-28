import { beforeEach, describe, expect, it } from 'vitest';
import { createServices } from '@/lib/api/services';
import { createHttpClient } from '@/lib/api/create-http-client';
import { ApiError } from '@/lib/api';
import { useSessionStore, selectCurrentUser } from '@/stores';
import { MOCK_DEMO_CREDENTIALS } from '@/testing/mocks/seed/user.seed';
import { validateAvatarFile } from './utils/avatar-file';

describe('FE-05: Avatar Upload, Delete and Session Integration', () => {
  beforeEach(() => {
    useSessionStore.getState().clearSession();
  });

  it('validates file on client before calling API', () => {
    const oversized = { size: 3 * 1024 * 1024, type: 'image/png' };
    const invalidType = { size: 1024, type: 'image/gif' };
    const valid = { size: 1024, type: 'image/webp' };

    expect(validateAvatarFile(oversized).valid).toBe(false);
    expect(validateAvatarFile(oversized).errorKey).toBe('errors.fileTooLarge');

    expect(validateAvatarFile(invalidType).valid).toBe(false);
    expect(validateAvatarFile(invalidType).errorKey).toBe('errors.unsupportedFileType');

    expect(validateAvatarFile(valid).valid).toBe(true);
  });

  it('runs complete avatar upload and delete cycle on mock backend updating session store', async () => {
    let currentToken: string | null = null;
    const client = createHttpClient({
      mode: 'mock',
      mockLatencyMs: 0,
      getAccessToken: () => currentToken,
    });
    const services = createServices(client);

    // 1. Login user and set session
    const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
    currentToken = session.accessToken;
    useSessionStore.getState().setSession(session);

    const initialUser = selectCurrentUser(useSessionStore.getState());
    expect(initialUser).toBeDefined();

    // 2. Reject client-side if file is invalid without calling API
    const badFile = new File(['a'.repeat(3 * 1024 * 1024)], 'too-big.png', { type: 'image/png' });
    const validation = validateAvatarFile(badFile);
    expect(validation.valid).toBe(false);
    expect(validation.error).toBe('file_too_large');

    // 3. Server-side validation handles 413 and 415 as safety fallback
    const oversizedFile = new File(['a'.repeat(2 * 1024 * 1024 + 50)], 'huge.png', { type: 'image/png' });
    const serverErr = await services.auth.uploadAvatar(oversizedFile).catch((e: unknown) => e);
    expect(serverErr).toBeInstanceOf(ApiError);
    expect((serverErr as ApiError).code).toBe('file_too_large');
    expect((serverErr as ApiError).status).toBe(413);

    const unsupportedFile = new File(['dummy content'], 'doc.pdf', { type: 'application/pdf' });
    const unsupportedErr = await services.auth.uploadAvatar(unsupportedFile).catch((e: unknown) => e);
    expect(unsupportedErr).toBeInstanceOf(ApiError);
    expect((unsupportedErr as ApiError).code).toBe('unsupported_file_type');
    expect((unsupportedErr as ApiError).status).toBe(415);

    // 4. Upload valid avatar
    const validFile = new File(['fake-image-bytes'], 'avatar.webp', { type: 'image/webp' });
    const uploadResult = await services.auth.uploadAvatar(validFile);
    expect(uploadResult.avatarUrl).toBeDefined();
    expect(uploadResult.avatarUrl).toContain('storage.cuteteachy.vn');

    // Update session store (simulating hook onSuccess)
    useSessionStore.getState().updateUser(uploadResult);
    const updatedUser = selectCurrentUser(useSessionStore.getState());
    expect(updatedUser?.avatarUrl).toBe(uploadResult.avatarUrl);

    // 5. Delete avatar
    const deleteResult = await services.auth.deleteAvatar();
    expect(deleteResult.avatarUrl).toBeUndefined();

    // Update session store (simulating hook onSuccess)
    useSessionStore.getState().updateUser(deleteResult);
    const userAfterDelete = selectCurrentUser(useSessionStore.getState());
    expect(userAfterDelete?.avatarUrl).toBeUndefined();
  });
});
