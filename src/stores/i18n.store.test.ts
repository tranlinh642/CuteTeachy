import { beforeEach, describe, expect, it } from 'vitest';
import { useI18nStore } from './i18n.store';

describe('useI18nStore', () => {
  beforeEach(() => {
    useI18nStore.setState({ locale: 'vi' });
  });

  it('initializes with default locale vi', () => {
    expect(useI18nStore.getState().locale).toBe('vi');
  });

  it('updates locale via setLocale', () => {
    useI18nStore.getState().setLocale('en');
    expect(useI18nStore.getState().locale).toBe('en');

    useI18nStore.getState().setLocale('vi');
    expect(useI18nStore.getState().locale).toBe('vi');
  });
});
