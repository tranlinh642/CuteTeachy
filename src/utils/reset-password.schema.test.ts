import { describe, expect, it } from 'vitest';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './reset-password.schema';
import { validate } from './validate';

describe('Verification and Password Reset Schemas', () => {
  describe('verifyEmailSchema', () => {
    it('rejects empty fields', () => {
      const result = validate(verifyEmailSchema, { email: '', code: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.email?.key).toBe('validation.required');
        expect(result.errors.code?.key).toBe('validation.required');
      }
    });

    it('rejects code that is not 6 digits', () => {
      const nonDigits = validate(verifyEmailSchema, {
        email: 'teacher@school.edu.vn',
        code: '12345a',
      });
      expect(nonDigits.success).toBe(false);
      if (!nonDigits.success) {
        expect(nonDigits.errors.code?.key).toBe('auth.errors.invalidCode');
      }

      const shortCode = validate(verifyEmailSchema, {
        email: 'teacher@school.edu.vn',
        code: '12345',
      });
      expect(shortCode.success).toBe(false);
      if (!shortCode.success) {
        expect(shortCode.errors.code?.key).toBe('auth.errors.invalidCode');
      }
    });

    it('accepts valid email and 6-digit code', () => {
      const result = validate(verifyEmailSchema, {
        email: '  teacher@school.edu.vn  ',
        code: '123456',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('teacher@school.edu.vn');
        expect(result.data.code).toBe('123456');
      }
    });
  });

  describe('forgotPasswordSchema', () => {
    it('rejects empty or invalid email', () => {
      const empty = validate(forgotPasswordSchema, { email: '' });
      expect(empty.success).toBe(false);
      if (!empty.success) {
        expect(empty.errors.email?.key).toBe('validation.required');
      }

      const invalid = validate(forgotPasswordSchema, { email: 'not-an-email' });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.errors.email?.key).toBe('validation.email');
      }
    });

    it('accepts valid email and trims whitespace', () => {
      const valid = validate(forgotPasswordSchema, { email: '  linh@cuteteachy.vn ' });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.email).toBe('linh@cuteteachy.vn');
      }
    });
  });

  describe('resetPasswordSchema', () => {
    it('rejects passwords shorter than 8 chars or longer than 72 chars', () => {
      const short = validate(resetPasswordSchema, {
        email: 'teacher@school.edu.vn',
        code: '123456',
        newPassword: 'short',
        confirmPassword: 'short',
      });
      expect(short.success).toBe(false);
      if (!short.success) {
        expect(short.errors.newPassword?.key).toBe('validation.minLength');
        expect(short.errors.newPassword?.params?.count).toBe(8);
      }

      const tooLong = validate(resetPasswordSchema, {
        email: 'teacher@school.edu.vn',
        code: '123456',
        newPassword: 'a'.repeat(73),
        confirmPassword: 'a'.repeat(73),
      });
      expect(tooLong.success).toBe(false);
      if (!tooLong.success) {
        expect(tooLong.errors.newPassword?.key).toBe('validation.maxLength');
        expect(tooLong.errors.newPassword?.params?.count).toBe(72);
      }
    });

    it('rejects mismatched newPassword and confirmPassword', () => {
      const mismatch = validate(resetPasswordSchema, {
        email: 'teacher@school.edu.vn',
        code: '123456',
        newPassword: 'Password123',
        confirmPassword: 'Password456',
      });
      expect(mismatch.success).toBe(false);
      if (!mismatch.success) {
        expect(mismatch.errors.confirmPassword?.key).toBe('auth.reset.passwordMismatch');
      }
    });

    it('validates matching valid passwords and trims email and code', () => {
      const valid = validate(resetPasswordSchema, {
        email: ' teacher@school.edu.vn ',
        code: ' 654321 ',
        newPassword: 'NewStrongPassword123',
        confirmPassword: 'NewStrongPassword123',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.email).toBe('teacher@school.edu.vn');
        expect(valid.data.code).toBe('654321');
        expect(valid.data.newPassword).toBe('NewStrongPassword123');
      }
    });
  });
});
