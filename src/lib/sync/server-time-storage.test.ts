import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryStorage } from '@/stores';
import {
  clearAllStoredServerTimes,
  getServerTimeStorageKey,
  getStoredServerTime,
  removeStoredServerTime,
  serializeQueryKey,
  setStoredServerTime,
} from './server-time-storage';

describe('server-time-storage', () => {
  let memoryStorage: ReturnType<typeof createMemoryStorage>;

  beforeEach(() => {
    memoryStorage = createMemoryStorage();
  });

  it('serializes string and array query keys predictably', () => {
    expect(serializeQueryKey('tags')).toBe('tags');
    expect(serializeQueryKey(['tasks', 'list', '2026-10-26'])).toBe('["tasks","list","2026-10-26"]');
    expect(getServerTimeStorageKey('tags')).toBe('cute-teachy:sync:server-time:tags');
  });

  it('returns null when no checkpoint is stored', async () => {
    const time = await getStoredServerTime(['tags'], memoryStorage);
    expect(time).toBeNull();
  });

  it('stores and retrieves serverTime checkpoint', async () => {
    const serverTime = '2026-10-26T14:00:00.000Z';
    await setStoredServerTime(['tasks', 'list', 'today'], serverTime, memoryStorage);

    const retrieved = await getStoredServerTime(['tasks', 'list', 'today'], memoryStorage);
    expect(retrieved).toBe(serverTime);
  });

  it('removes stored checkpoint when requested', async () => {
    const serverTime = '2026-10-26T14:00:00.000Z';
    await setStoredServerTime(['tags'], serverTime, memoryStorage);

    await removeStoredServerTime(['tags'], memoryStorage);
    const retrieved = await getStoredServerTime(['tags'], memoryStorage);
    expect(retrieved).toBeNull();
  });

  it('clears all registered checkpoints at once', async () => {
    await setStoredServerTime(['tags'], '2026-10-26T10:00:00Z', memoryStorage);
    await setStoredServerTime(['tasks'], '2026-10-26T11:00:00Z', memoryStorage);
    await setStoredServerTime(['notes'], '2026-10-26T12:00:00Z', memoryStorage);

    await clearAllStoredServerTimes(memoryStorage);

    expect(await getStoredServerTime(['tags'], memoryStorage)).toBeNull();
    expect(await getStoredServerTime(['tasks'], memoryStorage)).toBeNull();
    expect(await getStoredServerTime(['notes'], memoryStorage)).toBeNull();
  });
});
