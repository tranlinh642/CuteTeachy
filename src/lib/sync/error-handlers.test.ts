import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { ApiError } from '@/lib/api/api-error';
import {
  executeSyncMutation,
  handleGoneError,
  isGoneError,
  isIdConflictError,
  removeEntityFromCache,
} from './error-handlers';

describe('sync error handlers', () => {
  describe('isGoneError & isIdConflictError', () => {
    it('recognizes 410 gone from ApiError and AxiosError', () => {
      expect(isGoneError(new ApiError('gone', 'Resource deleted', 410))).toBe(true);

      const axiosErr = new AxiosError(
        'Request failed with status code 410',
        'ERR_BAD_REQUEST',
        undefined,
        {},
        {
          data: { code: 'gone', message: 'Item deleted' },
          status: 410,
          statusText: 'Gone',
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      );
      expect(isGoneError(axiosErr)).toBe(true);

      expect(isGoneError(new ApiError('not_found', 'Not found', 404))).toBe(false);
      expect(isGoneError(new Error('Random'))).toBe(false);
    });

    it('recognizes 409 id_conflict from ApiError and AxiosError', () => {
      expect(isIdConflictError(new ApiError('id_conflict', 'Id taken by another user', 409))).toBe(true);

      const axiosErr = new AxiosError(
        'Request failed with status code 409',
        'ERR_BAD_REQUEST',
        undefined,
        {},
        {
          data: { code: 'id_conflict', message: 'Conflict' },
          status: 409,
          statusText: 'Conflict',
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      );
      expect(isIdConflictError(axiosErr)).toBe(true);
      expect(isIdConflictError(new ApiError('email_taken', 'Email taken', 409))).toBe(false);
    });
  });

  describe('removeEntityFromCache', () => {
    it('removes entity from flat array cache', () => {
      const queryClient = new QueryClient();
      const queryKey = ['items'];
      queryClient.setQueryData(queryKey, [
        { id: '1', title: 'One' },
        { id: '2', title: 'Two' },
      ]);

      removeEntityFromCache(queryClient, queryKey, '1');
      expect(queryClient.getQueryData(queryKey)).toEqual([{ id: '2', title: 'Two' }]);
    });

    it('removes entity from object with items array', () => {
      const queryClient = new QueryClient();
      const queryKey = ['envelope-items'];
      queryClient.setQueryData(queryKey, {
        items: [
          { id: '1', title: 'One' },
          { id: '2', title: 'Two' },
        ],
        serverTime: '2026-10-26T10:00:00Z',
      });

      removeEntityFromCache(queryClient, queryKey, '2');
      expect(queryClient.getQueryData(queryKey)).toEqual({
        items: [{ id: '1', title: 'One' }],
        serverTime: '2026-10-26T10:00:00Z',
      });
    });

    it('removes entity from infinite query pages', () => {
      const queryClient = new QueryClient();
      const queryKey = ['paginated'];
      queryClient.setQueryData(queryKey, {
        pages: [
          [{ id: '1', title: 'One' }, { id: '2', title: 'Two' }],
          [{ id: '3', title: 'Three' }],
        ],
        pageParams: [null, 'cursor-2'],
      });

      removeEntityFromCache(queryClient, queryKey, '2');
      expect(queryClient.getQueryData(queryKey)).toEqual({
        pages: [
          [{ id: '1', title: 'One' }],
          [{ id: '3', title: 'Three' }],
        ],
        pageParams: [null, 'cursor-2'],
      });
    });
  });

  describe('handleGoneError', () => {
    it('removes record from cache and executes onHandled callback on 410', () => {
      const queryClient = new QueryClient();
      const queryKey = ['items'];
      queryClient.setQueryData(queryKey, [{ id: 'target', title: 'Target' }]);
      const onHandled = vi.fn();

      const handled = handleGoneError(new ApiError('gone', 'Item already deleted', 410), {
        queryClient,
        queryKey,
        entityId: 'target',
        onHandled,
      });

      expect(handled).toBe(true);
      expect(onHandled).toHaveBeenCalled();
      expect(queryClient.getQueryData(queryKey)).toEqual([]);
    });

    it('returns false and leaves cache untouched on other errors', () => {
      const queryClient = new QueryClient();
      const queryKey = ['items'];
      queryClient.setQueryData(queryKey, [{ id: 'target', title: 'Target' }]);
      const onHandled = vi.fn();

      const handled = handleGoneError(new ApiError('validation', 'Bad request', 400), {
        queryClient,
        queryKey,
        entityId: 'target',
        onHandled,
      });

      expect(handled).toBe(false);
      expect(onHandled).not.toHaveBeenCalled();
      expect(queryClient.getQueryData(queryKey)).toEqual([{ id: 'target', title: 'Target' }]);
    });
  });

  describe('executeSyncMutation', () => {
    it('returns result when mutation succeeds', async () => {
      const queryClient = new QueryClient();
      const result = await executeSyncMutation(async () => ({ id: '1', title: 'Success' }), {
        queryClient,
        queryKey: ['items'],
        entityId: '1',
      });

      expect(result).toEqual({ id: '1', title: 'Success' });
    });

    it('swallows 410 gone error, removes entity from cache, and returns null', async () => {
      const queryClient = new QueryClient();
      const queryKey = ['items'];
      queryClient.setQueryData(queryKey, [{ id: 'dead-id', title: 'Dead' }]);
      const onGone = vi.fn();

      const result = await executeSyncMutation(
        async () => {
          throw new ApiError('gone', 'Record was deleted on server', 410);
        },
        {
          queryClient,
          queryKey,
          entityId: 'dead-id',
          onHandled: onGone,
        },
      );

      // Does not throw! Returns null
      expect(result).toBeNull();
      expect(onGone).toHaveBeenCalled();
      expect(queryClient.getQueryData(queryKey)).toEqual([]);
    });

    it('rethrows non-410 errors', async () => {
      const queryClient = new QueryClient();
      await expect(
        executeSyncMutation(
          async () => {
            throw new ApiError('validation', 'Name is required', 400);
          },
          {
            queryClient,
            queryKey: ['items'],
            entityId: 'any',
          },
        ),
      ).rejects.toMatchObject({ code: 'validation' });
    });
  });
});
