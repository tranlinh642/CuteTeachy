import { describe, expect, it } from 'vitest';
import { generateClientUuid, isUuid, withClientId } from './client-id';

describe('client-id utilities', () => {
  it('generates a valid UUID v4', () => {
    const uuid = generateClientUuid();
    expect(isUuid(uuid)).toBe(true);
  });

  it('generates unique UUIDs on consecutive calls', () => {
    const uuid1 = generateClientUuid();
    const uuid2 = generateClientUuid();
    expect(uuid1).not.toBe(uuid2);
  });

  it('attaches a new client UUID when input has no id', () => {
    const input = { title: 'Luyện chữ', date: '2026-10-26' };
    const result = withClientId(input);

    expect(isUuid(result.id)).toBe(true);
    expect(result.title).toBe('Luyện chữ');
    expect(result.date).toBe('2026-10-26');
  });

  it('preserves existing id from input (for offline mutation replay)', () => {
    const existingId = 'c8b2a3f4-5678-4abc-9def-0123456789ab';
    const input = { id: existingId, title: 'Luyện chữ' };
    const result = withClientId(input);

    expect(result.id).toBe(existingId);
  });

  it('preserves explicit existingId parameter when supplied', () => {
    const explicitId = 'f1a2b3c4-9999-4000-8000-0123456789cd';
    const input = { title: 'Soạn bài' };
    const result = withClientId(input, explicitId);

    expect(result.id).toBe(explicitId);
  });
});
