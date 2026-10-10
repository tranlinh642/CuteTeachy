import { describe, expect, it } from 'vitest';
import { createTranslator, interpolate } from './translator';

describe('interpolate', () => {
  it('replaces known placeholders and keeps unknown ones', () => {
    expect(interpolate('Hi {{name}}, {{x}}', { name: 'Linh' })).toBe('Hi Linh, {{x}}');
  });
});

describe('createTranslator', () => {
  it('translates Vietnamese by default keys', () => {
    const t = createTranslator('vi');
    expect(t('home.greeting.morning', { name: 'Linh' })).toBe('Chào buổi sáng, Linh!');
  });

  it('translates English', () => {
    const t = createTranslator('en');
    expect(t('navigation.home')).toBe('Home');
  });

  it('returns the key when missing', () => {
    const t = createTranslator('en');
    // @ts-expect-error – intentionally invalid key
    expect(t('does.not.exist')).toBe('does.not.exist');
  });
});
