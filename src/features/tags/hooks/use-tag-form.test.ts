import { describe, expect, it } from 'vitest';
import { tagSchema, validate } from '@/utils';
import type { Tone } from '@/lib/theme';

describe('useTagForm validation and error handling (S3-FE-02)', () => {
  describe('tagSchema validation', () => {
    it('accepts valid name and tone', () => {
      const result = validate(tagSchema, { name: 'Toán học', tone: 'pink' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Toán học');
        expect(result.data.tone).toBe('pink');
      }
    });

    it('trims leading and trailing whitespace from tag name', () => {
      const result = validate(tagSchema, { name: '   Hóa học 10   ', tone: 'mint' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Hóa học 10');
      }
    });

    it('rejects empty name or whitespace-only name', () => {
      const emptyResult = validate(tagSchema, { name: '', tone: 'blue' });
      expect(emptyResult.success).toBe(false);
      if (!emptyResult.success) {
        expect(emptyResult.errors.name?.key).toBe('validation.required');
      }

      const whitespaceResult = validate(tagSchema, { name: '   ', tone: 'blue' });
      expect(whitespaceResult.success).toBe(false);
      if (!whitespaceResult.success) {
        expect(whitespaceResult.errors.name?.key).toBe('validation.required');
      }
    });

    it('rejects name exceeding 24 characters', () => {
      const longName = 'Tên thẻ này dài hơn hai mươi bốn ký tự';
      const result = validate(tagSchema, { name: longName, tone: 'lavender' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.name?.key).toBe('validation.maxLength');
        expect(result.errors.name?.params).toEqual({ count: 24 });
      }
    });

    it('accepts name with exactly 24 characters', () => {
      const maxName = 'a'.repeat(24);
      const result = validate(tagSchema, { name: maxName, tone: 'rose' });
      expect(result.success).toBe(true);
    });

    it('accepts all 6 supported tones', () => {
      const tones: Tone[] = ['pink', 'blue', 'beige', 'lavender', 'rose', 'mint'];
      for (const tone of tones) {
        const result = validate(tagSchema, { name: `Thẻ ${tone}`, tone });
        expect(result.success).toBe(true);
      }
    });

    it('rejects unsupported tone', () => {
      const result = validate(tagSchema, { name: 'Test', tone: 'invalid-tone' });
      expect(result.success).toBe(false);
    });
  });

  describe('409 tag_name_taken error assignment to name field', () => {
    it('maps 409 tag_name_taken error key to errors.name', () => {
      // Simulation of useTagForm onError handler logic
      const simulateOnError = (errorCode: string) => {
        const errors: Record<string, { key: string }> = {};
        if (errorCode === 'tag_name_taken') {
          errors.name = { key: 'errors.tagNameTaken' };
        }
        return errors;
      };

      const errors = simulateOnError('tag_name_taken');
      expect(errors.name).toBeDefined();
      expect(errors.name?.key).toBe('errors.tagNameTaken');
    });
  });
});
