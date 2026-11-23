import { describe, expect, it } from 'vitest';
import { isTextEntryElement } from './use-mobile-keyboard';

function mockElement(tagName: string, attrs: Record<string, string | null> = {}): Element {
  return {
    tagName,
    getAttribute: (name: string) => attrs[name] ?? null,
  } as unknown as Element;
}

describe('use-mobile-keyboard: isTextEntryElement', () => {
  it('identifies text inputs, textareas, and contenteditable elements', () => {
    expect(isTextEntryElement(mockElement('INPUT', { type: 'text' }))).toBe(true);
    expect(isTextEntryElement(mockElement('INPUT', {}))).toBe(true);
    expect(isTextEntryElement(mockElement('INPUT', { type: 'email' }))).toBe(true);
    expect(isTextEntryElement(mockElement('INPUT', { type: 'password' }))).toBe(true);
    expect(isTextEntryElement(mockElement('TEXTAREA'))).toBe(true);
    expect(isTextEntryElement(mockElement('DIV', { contenteditable: 'true' }))).toBe(true);
  });

  it('ignores non-text inputs and buttons so keyboard hiding does not trigger mistakenly', () => {
    expect(isTextEntryElement(mockElement('INPUT', { type: 'checkbox' }))).toBe(false);
    expect(isTextEntryElement(mockElement('INPUT', { type: 'radio' }))).toBe(false);
    expect(isTextEntryElement(mockElement('INPUT', { type: 'file' }))).toBe(false);
    expect(isTextEntryElement(mockElement('BUTTON'))).toBe(false);
    expect(isTextEntryElement(null)).toBe(false);
  });
});
