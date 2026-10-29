'use client';

import type {
  ID,
  InAppNotification,
  InAppNotificationListResponse,
  ListNotificationsParams,
  MarkAllNotificationsReadResponse,
} from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';
import { queryKeys } from '@/lib/query';

export interface UseNotificationsOptions extends ListNotificationsParams {
  readonly enabled?: boolean;
}

export function useNotifications(options?: UseNotificationsOptions) {
  const { notifications } = useServices();
  const params: ListNotificationsParams | undefined =
    options?.unreadOnly !== undefined || options?.limit !== undefined
      ? {
          unreadOnly: options.unreadOnly,
          limit: options.limit,
        }
      : undefined;

  return useQuery<InAppNotificationListResponse, ApiError>({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => notifications.list(params),
    enabled: options?.enabled ?? true,
  });
}

interface NotificationMutationContext {
  readonly snapshot: [readonly unknown[], InAppNotificationListResponse | undefined][];
}

export function useMarkNotificationRead() {
  const { notifications } = useServices();
  const queryClient = useQueryClient();

  return useMutation<InAppNotification, ApiError, ID, NotificationMutationContext>({
    mutationFn: (id) => notifications.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const snapshot = queryClient.getQueriesData<InAppNotificationListResponse>({
        queryKey: queryKeys.notifications.all,
      });

      const readIso = new Date().toISOString();
      queryClient.setQueriesData<InAppNotificationListResponse>(
        { queryKey: queryKeys.notifications.all },
        (old) => {
          if (!old) return old;
          let wasUnread = false;
          const items = old.items.map((item) => {
            if (item.id === id) {
              if (item.readAt === null) {
                wasUnread = true;
              }
              return { ...item, readAt: item.readAt ?? readIso };
            }
            return item;
          });
          return {
            items,
            unreadCount: wasUnread ? Math.max(0, old.unreadCount - 1) : old.unreadCount,
          };
        },
      );

      return { snapshot };
    },
    onError: (_err, _id, context) => {
      context?.snapshot.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { notifications } = useServices();
  const queryClient = useQueryClient();

  return useMutation<
    MarkAllNotificationsReadResponse,
    ApiError,
    void,
    NotificationMutationContext
  >({
    mutationFn: () => notifications.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const snapshot = queryClient.getQueriesData<InAppNotificationListResponse>({
        queryKey: queryKeys.notifications.all,
      });

      const readIso = new Date().toISOString();
      queryClient.setQueriesData<InAppNotificationListResponse>(
        { queryKey: queryKeys.notifications.all },
        (old) => {
          if (!old) return old;
          return {
            items: old.items.map((item) => ({
              ...item,
              readAt: item.readAt ?? readIso,
            })),
            unreadCount: 0,
          };
        },
      );

      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
