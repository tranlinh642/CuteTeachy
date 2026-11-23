import type { ID, ISODateTime } from './common.interface';

export const IN_APP_NOTIFICATION_TYPES = ['task', 'class_session', 'note', 'system'] as const;
export type InAppNotificationType = (typeof IN_APP_NOTIFICATION_TYPES)[number];

/** In-App Notification record displayed in the Notification Center (bell icon) & local ticker. */
export interface InAppNotification {
  readonly id: ID;
  readonly accountId: ID;
  readonly type: InAppNotificationType;
  readonly targetId: ID | null;
  readonly title: string;
  readonly body: string;
  readonly url: string;
  readonly data?: Record<string, unknown> | null;
  readonly readAt: ISODateTime | null;
  readonly createdAt: ISODateTime;
}

export interface InAppNotificationListResponse {
  readonly items: readonly InAppNotification[];
  readonly unreadCount: number;
}

export interface ListNotificationsParams {
  readonly unreadOnly?: boolean;
  readonly limit?: number;
}

export interface MarkAllNotificationsReadResponse {
  readonly updatedCount: number;
}
