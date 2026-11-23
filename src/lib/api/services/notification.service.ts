import type { AxiosInstance } from 'axios';
import { ENDPOINTS } from '../endpoints';
import type {
  ID,
  InAppNotification,
  InAppNotificationListResponse,
  ListNotificationsParams,
  MarkAllNotificationsReadResponse,
} from '@/types';

export const createNotificationService = (http: AxiosInstance) => {
  const list = (params?: ListNotificationsParams) =>
    http
      .get<InAppNotificationListResponse>(ENDPOINTS.notifications.root, { params })
      .then((res) => res.data);

  const markRead = (id: ID) =>
    http
      .patch<InAppNotification>(ENDPOINTS.notifications.markRead(id))
      .then((res) => res.data);

  const markAllRead = () =>
    http
      .post<MarkAllNotificationsReadResponse>(ENDPOINTS.notifications.readAll)
      .then((res) => res.data);

  return {
    list,
    markRead,
    markAsRead: markRead,
    markAllRead,
    readAll: markAllRead,
  };
};

export type NotificationService = ReturnType<typeof createNotificationService>;
