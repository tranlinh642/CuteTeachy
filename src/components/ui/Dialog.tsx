'use client';

import { useTranslation } from '@/lib/i18n';
import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Drawer } from 'vaul';
import { cn } from '@/utils/cn';
import { useMediaQuery } from '@/hooks';
import { IconButton } from './IconButton';

export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  readonly size?: DialogSize;
  /** Hàng nút cuối (Hủy / Lưu…). */
  readonly footer?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
}

const SIZE_CLASS: Readonly<Record<DialogSize, string>> = {
  sm: 'md:w-[min(calc(100%-2rem),26rem)]',
  md: 'md:w-[min(calc(100%-2rem),36rem)]',
  lg: 'md:w-[min(calc(100%-2rem),46rem)]',
};

const FOCUSABLE =
  'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

const subscribeNoop = () => () => {};

/**
 * Hộp thoại tương thích thiết bị:
 * - Mobile (< 768px): Vaul Drawer vuốt kéo mượt mà, snap physics, handle kéo đóng.
 * - Desktop (>= 768px): Hộp thoại căn giữa dựa trên `<dialog>` chuẩn.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  className,
  children,
}: DialogProps) {
  const { t } = useTranslation();
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const isMobile = useMediaQuery('(max-width: 767px)', false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const openRef = useRef(open);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (isMobile) return;
    openRef.current = open;
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      const target =
        dialog.querySelector<HTMLElement>('[data-autofocus]') ?? bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
      returnFocusRef.current?.focus();
    }
  }, [open, isClient, isMobile]);

  if (!isClient) return null;

  // 1. Mobile Experience: Native Vaul Bottom Sheet Drawer with Drag Gestures
  if (isMobile) {
    return (
      <Drawer.Root
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose();
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="bg-scrim/40 fixed inset-0 z-50 backdrop-blur-xs animate-in fade-in duration-200" />
          <Drawer.Content
            className={cn(
              'bg-surface-container-lowest text-on-surface border-surface-variant/40 fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl border-t shadow-2xl outline-none',
              className,
            )}
          >
            {/* Thanh grab bar hỗ trợ gesture kéo xuống để đóng */}
            <Drawer.Handle className="bg-outline-variant/60 mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full" />
            <header className="flex items-start justify-between gap-4 px-6 pt-3 pb-3">
              <div className="min-w-0 pt-1">
                <Drawer.Title className="text-headline-md text-on-surface">{title}</Drawer.Title>
                {description ? (
                  <Drawer.Description className="text-body-sm text-on-surface-variant mt-1">
                    {description}
                  </Drawer.Description>
                ) : (
                  <Drawer.Description className="sr-only">{title}</Drawer.Description>
                )}
              </div>
              <IconButton icon="close" aria-label={t('common.actions.close')} onClick={onClose} className="-mr-2" />
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">{children}</div>
            {footer && (
              <footer className="border-surface-variant bg-surface-container-low flex flex-wrap items-center justify-end gap-3 border-t px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {footer}
              </footer>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // 2. Desktop Experience: Centered Native Modal Dialog
  return createPortal(
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        onClose();
      }}
      onClose={(event) => {
        if (event.target === event.currentTarget && openRef.current) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        'bg-surface-container-lowest text-on-surface border-outline-variant/30 static m-auto max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl border p-0 shadow-xl',
        SIZE_CLASS[size],
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
            <div className="min-w-0 pt-2">
              <h2 id={titleId} className="text-headline-md text-on-surface">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="text-body-sm text-on-surface-variant mt-1">
                  {description}
                </p>
              )}
            </div>
            <IconButton icon="close" aria-label={t('common.actions.close')} onClick={onClose} className="-mr-2" />
          </header>
          <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">
            {children}
          </div>
          {footer && (
            <footer className="border-surface-variant bg-surface-container-low flex flex-wrap items-center justify-end gap-3 border-t px-6 py-4">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>,
    document.body,
  );
}
