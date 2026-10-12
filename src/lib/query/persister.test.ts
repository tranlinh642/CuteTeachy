import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as idbKeyval from 'idb-keyval';
import { createIdbPersister } from './persister';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

describe('createIdbPersister', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('returns undefined when window is undefined', () => {
    vi.unstubAllGlobals();
    const persister = createIdbPersister('test-key');
    expect(persister).toBeUndefined();
  });

  it('returns persister when window is defined', async () => {
    const persister = createIdbPersister('test-key');
    expect(persister).toBeDefined();
    expect(typeof persister?.persistClient).toBe('function');
    expect(typeof persister?.restoreClient).toBe('function');
  });

  it('restores client from idb-keyval successfully', async () => {
    const mockData = JSON.stringify({
      timestamp: Date.now(),
      buster: '',
      clientState: { queries: [], mutations: [] },
    });
    vi.mocked(idbKeyval.get).mockResolvedValueOnce(mockData);

    const persister = createIdbPersister('test-key');
    const result = await persister?.restoreClient();
    expect(idbKeyval.get).toHaveBeenCalledWith('test-key');
    expect(result).toEqual(JSON.parse(mockData));
  });

  it('handles read errors gracefully without throwing', async () => {
    vi.mocked(idbKeyval.get).mockRejectedValueOnce(new Error('IndexedDB blocked'));

    const persister = createIdbPersister('test-key');
    const result = await persister?.restoreClient();
    expect(result).toBeUndefined();
  });

  it('persists client to idb-keyval', async () => {
    vi.mocked(idbKeyval.set).mockResolvedValueOnce(undefined);

    const persister = createIdbPersister('test-key');
    const clientData = {
      timestamp: Date.now(),
      buster: '',
      clientState: { queries: [], mutations: [] },
    };

    await persister?.persistClient(clientData);
    expect(idbKeyval.set).toHaveBeenCalledWith('test-key', expect.any(String));
  });
});
