import { describe, expect, it } from 'vitest';
import { loginSchema } from './login.schema';

describe('loginSchema', () => {
  it('validates a correct payload', () => {
    const valid = loginSchema.safeParse({
      email: 'teacher@example.com',
      password: 'password123',
      remember: true,
    });
    expect(valid.success).toBe(true);
  });

  it('rejects passwords shorter than 8 characters', () => {
    const invalid = loginSchema.safeParse({
      email: 'teacher@example.com',
      password: '1234567', // 7 chars
    });
    expect(invalid.success).toBe(false);
  });

  it('accepts passwords of exactly 8 characters and exactly 72 characters', () => {
    const minLen = loginSchema.safeParse({
      email: 'teacher@example.com',
      password: 'a'.repeat(8),
    });
    expect(minLen.success).toBe(true);

    const maxLen = loginSchema.safeParse({
      email: 'teacher@example.com',
      password: 'a'.repeat(72),
    });
    expect(maxLen.success).toBe(true);
  });

  it('rejects passwords longer than 72 characters', () => {
    const invalid = loginSchema.safeParse({
      email: 'teacher@example.com',
      password: 'a'.repeat(73),
    });
    expect(invalid.success).toBe(false);
  });
});

