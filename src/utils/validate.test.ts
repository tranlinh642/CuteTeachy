import { describe, expect, it } from 'vitest';
import { loginSchema } from './login.schema';
import { taskSchema } from './task.schema';
import { validate } from './validate';

describe('validate', () => {
  it('maps zod issues to i18n keys with params', () => {
    const result = validate(loginSchema, { email: 'not-an-email', password: '123' });
    expect(result.success).toBe(false);
    expect(result.errors?.email).toEqual({ key: 'validation.email', params: undefined });
    expect(result.errors?.password).toEqual({ key: 'validation.minLength', params: { count: 8 } });
  });

  it('normalises optional task fields', () => {
    const result = validate(taskSchema, {
      title: '  Chấm bài  ',
      date: '2026-10-09',
      time: '',
      category: 'school',
      notes: '',
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      title: 'Chấm bài',
      time: undefined,
      notes: undefined,
      priority: 'normal',
      tagIds: [],
    });
  });
});
