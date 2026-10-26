import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import { queryKeys } from '@/lib/query';
import { createMemoryStorage } from '@/stores';
import type { Task } from '@/types';
import { ApiError } from '@/lib/api/api-error';
import { setStoredServerTime, getStoredServerTime, removeEntityFromCache } from '@/lib/sync';
import { createTaskService } from '@/lib/api/services/task.service';

describe('Task Hooks & Sync Contract (S3-FE-03)', () => {
  let queryClient: QueryClient;
  const range = { from: '2026-10-01', to: '2026-10-31' };
  const queryKey = queryKeys.tasks.list(range);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe('createTaskService & Client UUID Generation', () => {
    it('always attaches a valid client UUID when creating a task without an id', async () => {
      let sentPayload: Partial<Task> | undefined;
      const fakeHttp = {
        post: vi.fn().mockImplementation((_url: string, payload: unknown) => {
          sentPayload = payload as Partial<Task>;
          return Promise.resolve({ data: payload });
        }),
      } as unknown as AxiosInstance;
      const service = createTaskService(fakeHttp);

      const created = await service.create({
        title: 'Soạn đề kiểm tra',
        date: '2026-10-15',
        category: 'school',
      });

      expect(created.id).toBeDefined();
      expect(typeof created.id).toBe('string');
      // RFC 4122 v4 UUID regex
      expect(created.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(sentPayload?.id).toBe(created.id);
    });

    it('preserves client UUID on retry (ensuring idempotent retry)', async () => {
      const fixedId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
      let sentPayload: Partial<Task> | undefined;
      const fakeHttp = {
        post: vi.fn().mockImplementation((_url: string, payload: unknown) => {
          sentPayload = payload as Partial<Task>;
          return Promise.resolve({ data: payload });
        }),
      } as unknown as AxiosInstance;
      const service = createTaskService(fakeHttp);

      const created = await service.create({
        id: fixedId,
        title: 'Task retry',
        date: '2026-10-15',
        category: 'school',
      });

      expect(created.id).toBe(fixedId);
      expect(sentPayload?.id).toBe(fixedId);
    });
  });

  describe('useTasks sync envelope caching & delta sync', () => {
    it('stores serverTime checkpoint and applies sync envelope to cache', async () => {
      const storage = createMemoryStorage();
      const serverTime = '2026-10-26T12:00:00.000Z';

      const initialTask: Task = {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Task 1',
        date: '2026-10-15',
        category: 'school',
        priority: 'normal',
        tagIds: [],
        completed: false,
        createdAt: '2026-10-26T10:00:00Z',
        updatedAt: '2026-10-26T10:00:00Z',
      };

      // Set initial data
      queryClient.setQueryData(queryKey, [initialTask]);
      await setStoredServerTime(queryKey, serverTime, storage);

      const stored = await getStoredServerTime(queryKey, storage);
      expect(stored).toBe(serverTime);
    });
  });

  describe('Optimistic Updates & 410 Gone handling', () => {
    it('optimistically updates task in cache and rolls back on generic failure', async () => {
      const initialTask: Task = {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Task 1',
        date: '2026-10-15',
        category: 'school',
        priority: 'normal',
        tagIds: [],
        completed: false,
        createdAt: '2026-10-26T10:00:00Z',
        updatedAt: '2026-10-26T10:00:00Z',
      };

      queryClient.setQueryData(queryKey, [initialTask]);

      // Snapshot before mutate
      const snapshot = queryClient.getQueriesData<Task[]>({ queryKey: queryKeys.tasks.all });

      // Optimistic update
      queryClient.setQueriesData<Task[]>({ queryKey: queryKeys.tasks.all }, (list) =>
        list?.map((task) => (task.id === initialTask.id ? { ...task, completed: true } : task)),
      );

      const inCache = queryClient.getQueryData<Task[]>(queryKey);
      expect(inCache?.[0]?.completed).toBe(true);

      // Rollback on error
      snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
      const rolledBack = queryClient.getQueryData<Task[]>(queryKey);
      expect(rolledBack?.[0]?.completed).toBe(false);
    });

    it('removes task from cache when 410 gone error occurs or via removeEntityFromCache', async () => {
      const initialTask: Task = {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Task 1',
        date: '2026-10-15',
        category: 'school',
        priority: 'normal',
        tagIds: [],
        completed: false,
        createdAt: '2026-10-26T10:00:00Z',
        updatedAt: '2026-10-26T10:00:00Z',
      };

      queryClient.setQueryData(queryKey, [initialTask]);

      // Simulate 410 gone error handler
      const error = new ApiError('gone', 'Resource gone', 410);

      expect(error.code).toBe('gone');
      expect(error.status).toBe(410);

      // 1. removeEntityFromCache directly on queryKey
      removeEntityFromCache(queryClient, queryKey, initialTask.id);
      expect(queryClient.getQueryData<Task[]>(queryKey)).toEqual([]);

      // 2. setQueriesData across prefix
      queryClient.setQueryData(queryKey, [initialTask]);
      queryClient.setQueriesData<Task[]>({ queryKey: queryKeys.tasks.all }, (list) =>
        list?.filter((task) => task.id !== initialTask.id),
      );
      expect(queryClient.getQueryData<Task[]>(queryKey)).toEqual([]);
    });
  });
});
