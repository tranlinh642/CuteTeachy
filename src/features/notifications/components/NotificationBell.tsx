'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { ServicesContext } from '@/lib/api/services-context';
import type { ID, InAppNotification, InAppNotificationType } from '@/types';
import { Button, Icon } from '@/components/ui';
import type { IconName } from '@/lib/theme';
import { PushPermissionDialog, usePushNotification } from '@/features/push';
import { cn } from '@/utils/cn';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../api';

export interface NotificationBellProps {
  readonly defaultOpen?: boolean;
  readonly className?: string;
}

export interface ActivateNotificationCallbacks {
  readonly markRead: (id: ID) => Promise<unknown> | void;
  readonly navigate: (url: string) => void;
  readonly close: () => void;
}

export function sanitizeRedirectPath(
  url?: string | null,
  fallback = '/',
): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\')
  ) {
    return trimmed;
  }
  return fallback;
}

export async function activateNotificationItem(
  notification: InAppNotification,
  callbacks: ActivateNotificationCallbacks,
): Promise<void> {
  if (notification.readAt === null) {
    try {
      await callbacks.markRead(notification.id);
    } catch {
      // Proceed with navigation even if marking read fails
    }
  }
  callbacks.close();
  const safeUrl = sanitizeRedirectPath(notification.url, '/');
  if (safeUrl) {
    callbacks.navigate(safeUrl);
  }
}

function getNotificationIcon(type: InAppNotificationType): IconName {
  switch (type) {
    case 'class_session':
      return 'school';
    case 'task':
      return 'checklist';
    case 'note':
      return 'notes';
    case 'system':
    default:
      return 'bell';
  }
}

export function formatNotificationTimestamp(createdAt: string, localeTag: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat(localeTag, {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

function NotificationBellConnected({ defaultOpen = false, className }: NotificationBellProps) {
  const { t, localeTag } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useNotifications({ limit: 30 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const pushNotification = usePushNotification();

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const showPushPrompt =
    pushNotification.decision === 'can_prompt' ||
    pushNotification.decision === 'ios_needs_pwa';

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleItemClick = (notification: InAppNotification) => {
    void activateNotificationItem(notification, {
      markRead: (id) => markRead.mutateAsync(id),
      navigate: (url) => router.push(url),
      close: () => setIsOpen(false),
    });
  };

  const handleEnablePush = () => {
    if (pushNotification.decision === 'ios_needs_pwa') {
      pushNotification.openDialog();
      return;
    }
    void pushNotification.confirmPermission();
  };

  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center', className)}>
      <button
        type="button"
        data-testid="notification-bell-button"
        aria-label={
          unreadCount > 0
            ? `${t('notifications.bellAriaLabel')} (${t('notifications.unreadBadgeAria', { count: unreadCount })})`
            : t('notifications.bellAriaLabel')
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'relative inline-flex size-10 items-center justify-center rounded-full transition-colors cursor-pointer',
          'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isOpen && 'bg-surface-container text-primary',
        )}
      >
        <Icon name="bell" size={22} />
        {unreadCount > 0 && (
          <span
            data-testid="notification-unread-badge"
            className="bg-primary text-on-primary absolute -top-0.5 -right-0.5 inline-flex min-w-5 h-5 items-center justify-center rounded-full px-1 text-[11px] font-bold leading-none shadow-xs"
          >
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          data-testid="notification-popover"
          aria-label={t('notifications.title')}
          className={cn(
            'fixed inset-x-3 top-16 z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96',
            'rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xl overflow-hidden',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-outline-variant/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-title-md font-bold text-on-surface">
                {t('notifications.title')}
              </h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary-container px-2 py-0.5 text-label-xs font-bold text-on-primary-container">
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                data-testid="mark-all-read-button"
                disabled={markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
                className="text-label-sm font-semibold text-primary hover:underline disabled:opacity-50 cursor-pointer"
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {/* Gợi ý bật Web Push nếu thiết bị hiện tại chưa bật */}
          {showPushPrompt && (
            <div
              data-testid="bell-push-prompt"
              className="flex items-center justify-between gap-3 bg-primary-container/35 border-b border-primary/15 px-4 py-2.5"
            >
              <p className="text-body-xs text-on-surface flex-1">
                {t('notifications.enablePushPrompt')}
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon="bell"
                data-testid="bell-enable-push-button"
                loading={pushNotification.isSubscribing}
                onClick={handleEnablePush}
              >
                {pushNotification.decision === 'ios_needs_pwa'
                  ? t('notifications.iosGuideAction')
                  : t('notifications.enablePushAction')}
              </Button>
            </div>
          )}

          {/* Danh sách thông báo */}
          <div className="max-h-96 overflow-y-auto divide-y divide-outline-variant/20">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
                  <Icon name="bell" size={24} />
                </div>
                <p className="text-body-md font-semibold text-on-surface">
                  {t('notifications.empty')}
                </p>
                <p className="text-body-xs text-on-surface-variant">
                  {t('notifications.emptyDescription')}
                </p>
              </div>
            ) : (
              items.map((item) => {
                const isUnread = item.readAt === null;
                return (
                  <div
                    key={item.id}
                    data-testid={`notification-item-${item.id}`}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors',
                      isUnread
                        ? 'bg-primary-container/15 hover:bg-primary-container/25'
                        : 'hover:bg-surface-container-low',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className="flex flex-1 items-start gap-3 text-left min-w-0 cursor-pointer focus:outline-none"
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
                          isUnread
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-surface-container text-on-surface-variant',
                        )}
                      >
                        <Icon name={getNotificationIcon(item.type)} size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              'text-body-sm truncate',
                              isUnread
                                ? 'font-bold text-on-surface'
                                : 'font-medium text-on-surface-variant',
                            )}
                          >
                            {item.title}
                          </p>
                          {isUnread && (
                            <span
                              data-testid={`unread-dot-${item.id}`}
                              aria-label={t('notifications.unreadLabel')}
                              className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                            />
                          )}
                        </div>
                        <p className="text-body-xs text-on-surface-variant line-clamp-2 mt-0.5">
                          {item.body}
                        </p>
                        <p className="text-label-xs text-outline mt-1">
                          {formatNotificationTimestamp(item.createdAt, localeTag)}
                        </p>
                      </div>
                    </button>

                    {isUnread && (
                      <button
                        type="button"
                        data-testid={`mark-read-${item.id}`}
                        aria-label={t('notifications.markRead')}
                        title={t('notifications.markRead')}
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead.mutate(item.id);
                        }}
                        className="mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-primary cursor-pointer"
                      >
                        <Icon name="check" size={16} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <PushPermissionDialog
        open={pushNotification.isDialogOpen}
        step={pushNotification.dialogStep}
        isSubscribing={pushNotification.isSubscribing}
        error={pushNotification.error}
        onClose={pushNotification.closeDialog}
        onConfirm={pushNotification.confirmPermission}
      />
    </div>
  );
}

export function NotificationBell(props: NotificationBellProps = {}) {
  const services = useContext(ServicesContext);
  const { t } = useTranslation();

  if (!services) {
    return (
      <button
        type="button"
        data-testid="notification-bell-button"
        aria-label={t('notifications.bellAriaLabel')}
        className={cn(
          'relative inline-flex size-10 items-center justify-center rounded-full text-on-surface-variant',
          props.className,
        )}
      >
        <Icon name="bell" size={22} />
      </button>
    );
  }

  return <NotificationBellConnected {...props} />;
}
