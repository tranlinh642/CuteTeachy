import { describe, expect, it } from 'vitest';
import { loginSchema } from './login.schema';
import { taskSchema } from './task.schema';
import { noteSchema } from './note.schema';
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

  it('rejects more than 10 tags for task and note', () => {
    const elevenTags = Array.from({ length: 11 }, (_, i) => `tag-${i}`);
    const taskResult = validate(taskSchema, {
      title: 'Soạn bài',
      date: '2026-10-09',
      category: 'school',
      tagIds: elevenTags,
    });
    expect(taskResult.success).toBe(false);
    expect(taskResult.errors?.tagIds).toEqual({ key: 'validation.maxTags', params: { count: 10 } });

    const noteResult = validate(noteSchema, {
      title: 'Ý tưởng bài giảng',
      tagIds: elevenTags,
    });
    expect(noteResult.success).toBe(false);
    expect(noteResult.errors?.tagIds).toEqual({ key: 'validation.maxTags', params: { count: 10 } });
  });

  it('validates and normalises remindTime in noteSchema (S6-FE-01)', () => {
    const valid = validate(noteSchema, {
      title: 'Chuẩn bị phiếu bài tập',
      dueDate: '2026-10-30',
      remindTime: '08:30',
    });
    expect(valid.success).toBe(true);
    expect(valid.data).toMatchObject({
      title: 'Chuẩn bị phiếu bài tập',
      dueDate: '2026-10-30',
      remindTime: '08:30',
    });

    const emptyTime = validate(noteSchema, {
      title: 'Chuẩn bị phiếu bài tập',
      dueDate: '2026-10-30',
      remindTime: '',
    });
    expect(emptyTime.success).toBe(true);
    expect(emptyTime.data?.remindTime).toBeUndefined();

    const invalidTime = validate(noteSchema, {
      title: 'Chuẩn bị phiếu bài tập',
      dueDate: '2026-10-30',
      remindTime: '25:99',
    });
    expect(invalidTime.success).toBe(false);
    expect(invalidTime.errors?.remindTime).toEqual({
      key: 'validation.invalidTime',
      params: undefined,
    });
  });
});
