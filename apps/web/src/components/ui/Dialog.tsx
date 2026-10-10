'use client';

import { useTranslation } from '@cute-teachy/i18n';
import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
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
  sm: 'w-[min(calc(100%-2rem),26rem)]',
  md: 'w-[min(calc(100%-2rem),36rem)]',
  lg: 'w-[min(calc(100%-2rem),46rem)]',
};

const FOCUSABLE =
  'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

const subscribeNoop = () => () => {};

/**
 * Hộp thoại modal dựa trên `<dialog>` gốc: bẫy focus & lớp phủ do trình duyệt lo,
 * Esc / bấm nền để đóng, trả focus về phần tử đã mở khi đóng.
 * - Portal vào `body` để không lồng `<form>` khi mở dialog từ trong dialog khác.
 * - Nội dung chỉ mount khi mở → form luôn được reset.
 */
export function Dialog({ open, onClose, title, description, size = 'md', footer, className, children }: DialogProps) {
  const { t } = useTranslation();
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const openRef = useRef(open);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    openRef.current = open;
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      // Ưu tiên phần tử đánh dấu `data-autofocus`, sau đó là control đầu tiên trong thân.
      const target =
        dialog.querySelector<HTMLElement>('[data-autofocus]') ?? bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
      returnFocusRef.current?.focus();
    }
  }, [open, isClient]);

  if (!isClient) return null;

  // Sự kiện React lan theo cây component (kể cả qua portal) → chỉ xử lý sự kiện của chính dialog này.
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
      // Trình duyệt có thể tự đóng (close watcher) – đồng bộ lại state.
      onClose={(event) => {
        if (event.target === event.currentTarget && openRef.current) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        'bg-surface-container-lowest text-on-surface m-auto max-h-[calc(100dvh-2rem)] overflow-hidden rounded-xl p-0 shadow-lg',
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
