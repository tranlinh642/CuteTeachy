import type { notifications as Schema } from '../vi/notifications';

export const notifications: typeof Schema = {
  title: 'Notifications',
  bellAriaLabel: 'Notifications',
  unreadBadgeAria: '{{count}} unread notifications',
  markAllRead: 'Mark all as read',
  markRead: 'Mark as read',
  unreadLabel: 'Unread',
  empty: 'No notifications yet',
  emptyDescription:
    'Upcoming class session, task, and note reminders will appear here.',
  enablePushPrompt: 'Enable push notifications to receive reminders even when the app is closed.',
  enablePushAction: 'Enable notifications',
  iosGuideAction: 'PWA install guide',
  toastViewAction: 'View details',
  toastDismissAction: 'Dismiss',
  justNow: 'Just now',
};
