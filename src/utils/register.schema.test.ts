import { describe, expect, it } from 'vitest';
import { validate } from './validate';
import { registerSchema } from './register.schema';

describe('registerSchema', () => {
  it('validates a correct payload', () => {
    const valid = registerSchema.safeParse({
      email: 'linh@cuteteachy.vn',
      password: 'password123',
      confirmPassword: 'password123',
      remember: true,
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.remember).toBe(true);
    }
  });

  it('defaults remember to true if omitted', () => {
    const valid = registerSchema.safeParse({
      email: 'linh@cuteteachy.vn',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.remember).toBe(true);
    }
  });

  it('rejects invalid email address', () => {
    const result = validate(registerSchema, {
      email: 'not-an-email',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.email?.key).toBe('validation.email');
    }
  });

  it('rejects empty email', () => {
    const result = validate(registerSchema, {
      email: '   ',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.email?.key).toBe('validation.required');
    }
  });

  it('rejects password shorter than 8 characters', () => {
    const result = validate(registerSchema, {
      email: 'linh@cuteteachy.vn',
      password: 'short',
      confirmPassword: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.password?.key).toBe('validation.minLength');
      expect(result.errors.password?.params?.count).toBe(8);
    }
  });

  it('accepts password of exactly 8 characters and exactly 72 characters', () => {
    const minLen = registerSchema.safeParse({
      email: 'linh@cuteteachy.vn',
      password: 'a'.repeat(8),
      confirmPassword: 'a'.repeat(8),
    });
    expect(minLen.success).toBe(true);

    const maxLen = registerSchema.safeParse({
      email: 'linh@cuteteachy.vn',
      password: 'a'.repeat(72),
      confirmPassword: 'a'.repeat(72),
    });
    expect(maxLen.success).toBe(true);
  });

  it('rejects password longer than 72 characters', () => {
    const result = validate(registerSchema, {
      email: 'linh@cuteteachy.vn',
      password: 'a'.repeat(73),
      confirmPassword: 'a'.repeat(73),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.password?.key).toBe('validation.maxLength');
      expect(result.errors.password?.params?.count).toBe(72);
    }
  });

  it('rejects when confirmPassword does not match password', () => {
    const result = validate(registerSchema, {
      email: 'linh@cuteteachy.vn',
      password: 'password123',
      confirmPassword: 'differentpassword',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.confirmPassword?.key).toBe('auth.register.passwordMismatch');
    }
  });

  it('rejects empty confirmPassword with validation.required', () => {
    const result = validate(registerSchema, {
      email: 'linh@cuteteachy.vn',
      password: 'password123',
      confirmPassword: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.confirmPassword?.key).toBe('validation.required');
    }
  });
});
