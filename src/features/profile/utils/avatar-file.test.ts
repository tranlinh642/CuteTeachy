import { describe, expect, it } from 'vitest';
import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  validateAvatarFile,
} from './avatar-file';

describe('avatar-file: validateAvatarFile', () => {
  it('accepts valid jpeg, png, webp files within 2MB', () => {
    for (const type of ALLOWED_AVATAR_TYPES) {
      const file = { size: 1024, type };
      const result = validateAvatarFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.errorKey).toBeUndefined();
    }
  });

  it('accepts file exactly at boundary 2MB (2,097,152 bytes)', () => {
    const file = { size: MAX_AVATAR_BYTES, type: 'image/png' };
    const result = validateAvatarFile(file);
    expect(result.valid).toBe(true);
  });

  it('rejects file larger than 2MB with file_too_large and errors.fileTooLarge key', () => {
    const file = { size: MAX_AVATAR_BYTES + 1, type: 'image/png' };
    const result = validateAvatarFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('file_too_large');
    expect(result.errorKey).toBe('errors.fileTooLarge');
  });

  it('rejects unsupported mime types (pdf, gif, svg, text) with unsupported_file_type', () => {
    const unsupported = ['application/pdf', 'image/gif', 'image/svg+xml', 'text/plain'];
    for (const type of unsupported) {
      const file = { size: 1024, type };
      const result = validateAvatarFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('unsupported_file_type');
      expect(result.errorKey).toBe('errors.unsupportedFileType');
    }
  });

  it('prioritizes file_too_large when both size and type are invalid', () => {
    const file = { size: MAX_AVATAR_BYTES + 100, type: 'application/pdf' };
    const result = validateAvatarFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('file_too_large');
  });
});
