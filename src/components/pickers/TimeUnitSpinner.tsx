'use client';

import { useTranslation } from '@/lib/i18n';
import { cn } from '@/utils/cn';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { IconButton } from '@/components/ui';

export interface TimeWheelOption {
  readonly value: number;
  readonly label: string;
}

export interface TimeUnitSpinnerProps {
  /** Tên đơn vị: "Giờ" / "Phút". */
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  /** Chuỗi hiển thị (vd. "09"). */
  readonly display: string;
  /** Danh sách giá trị cuộn cho bánh xe chọn thời gian. */
  readonly options?: readonly TimeWheelOption[];
  readonly onSelect?: (nextValue: number) => void;
  readonly onIncrement: () => void;
  readonly onDecrement: () => void;
  readonly autoFocus?: boolean;
}

const ITEM_HEIGHT_PX = 44;
const VISIBLE_ROWS = 5;
const WHEEL_HEIGHT_PX = ITEM_HEIGHT_PX * VISIBLE_ROWS; // 220px
const SPACER_PX = ITEM_HEIGHT_PX * Math.floor(VISIBLE_ROWS / 2); // 88px

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Bánh xe chọn giờ/phút hỗ trợ:
 * - Vuốt dọc mượt (touch scroll-snap trên iOS/Android, tránh xung đột kéo đóng Vaul Drawer)
 * - Kéo chuột hoặc cuộn con lăn trên máy tính
 * - Chạm trực tiếp vào số lân cận hoặc bấm mũi tên tăng/giảm & phím ArrowUp/ArrowDown
 */
export function TimeUnitSpinner({
  label,
  value,
  min,
  max,
  display,
  options,
  onSelect,
  onIncrement,
  onDecrement,
  autoFocus,
}: TimeUnitSpinnerProps) {
  const { t } = useTranslation();
  const unit = label.toLocaleLowerCase();

  const resolvedOptions: readonly TimeWheelOption[] =
    options ??
    Array.from({ length: max - min + 1 }, (_, idx) => {
      const num = min + idx;
      return { value: num, label: String(num).padStart(2, '0') };
    });

  const selectedIndex = Math.max(
    0,
    resolvedOptions.findIndex((opt) => opt.value === value),
  );

  const listRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);
  const ignoreScrollUntilRef = useRef(0);
  const lastEmittedValueRef = useRef<number>(value);
  const dragStateRef = useRef<{
    active: boolean;
    startY: number;
    startScrollTop: number;
    moved: boolean;
  }>({
    active: false,
    startY: 0,
    startScrollTop: 0,
    moved: false,
  });

  const scrollToIndex = (index: number, behavior: ScrollBehavior) => {
    const el = listRef.current;
    if (!el) return;
    const targetTop = index * ITEM_HEIGHT_PX;
    if (behavior === 'smooth') {
      ignoreScrollUntilRef.current = Date.now() + 280;
    } else {
      ignoreScrollUntilRef.current = Date.now() + 60;
    }
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: targetTop, behavior });
    } else {
      el.scrollTop = targetTop;
    }
  };

  // Sync scroll position on initial open and external changes (buttons / keyboard / AM-PM)
  useIsomorphicLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    if (!didMountRef.current) {
      didMountRef.current = true;
      lastEmittedValueRef.current = value;
      scrollToIndex(selectedIndex, 'instant');
      return;
    }

    if (lastEmittedValueRef.current !== value) {
      lastEmittedValueRef.current = value;
      scrollToIndex(selectedIndex, 'smooth');
    }
  }, [selectedIndex, value]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el || !onSelect) return;
    if (Date.now() < ignoreScrollUntilRef.current) return;

    const rawIndex = Math.round(el.scrollTop / ITEM_HEIGHT_PX);
    const clampedIndex = Math.max(0, Math.min(resolvedOptions.length - 1, rawIndex));
    const nextOption = resolvedOptions[clampedIndex];
    if (nextOption && nextOption.value !== value) {
      lastEmittedValueRef.current = nextOption.value;
      onSelect(nextOption.value);
    }
  };

  const handleItemClick = (index: number, nextValue: number) => {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return;
    }
    lastEmittedValueRef.current = nextValue;
    scrollToIndex(index, 'smooth');
    onSelect?.(nextValue);
  };

  // Mouse drag-to-swipe support on desktop (touch uses native inertial scroll)
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const el = listRef.current;
    if (!el) return;
    dragStateRef.current = {
      active: true,
      startY: event.clientY,
      startScrollTop: el.scrollTop,
      moved: false,
    };
    el.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active || event.pointerType !== 'mouse') return;
    const el = listRef.current;
    if (!el) return;
    const deltaY = event.clientY - dragStateRef.current.startY;
    if (Math.abs(deltaY) > 4) {
      dragStateRef.current.moved = true;
    }
    el.scrollTop = dragStateRef.current.startScrollTop - deltaY;
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active || event.pointerType !== 'mouse') return;
    dragStateRef.current.active = false;
    const el = listRef.current;
    if (!el) return;
    el.releasePointerCapture?.(event.pointerId);
    const snappedIndex = Math.max(
      0,
      Math.min(resolvedOptions.length - 1, Math.round(el.scrollTop / ITEM_HEIGHT_PX)),
    );
    const nextOption = resolvedOptions[snappedIndex];
    if (nextOption) {
      lastEmittedValueRef.current = nextOption.value;
      scrollToIndex(snappedIndex, 'smooth');
      if (nextOption.value !== value) {
        onSelect?.(nextOption.value);
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp') {
      onDecrement();
      event.preventDefault();
    } else if (event.key === 'ArrowDown') {
      onIncrement();
      event.preventDefault();
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 select-none" data-vaul-no-drag="">
      <IconButton
        icon="chevronDown"
        size="sm"
        className="rotate-180 text-on-surface-variant"
        tabIndex={-1}
        aria-label={t('pickers.time.decrease', { unit })}
        onClick={onDecrement}
      />

      <div
        className="relative w-24 overflow-hidden rounded-2xl"
        style={{ height: WHEEL_HEIGHT_PX }}
        data-vaul-no-drag=""
      >
        {/* Top & bottom gradient fade masks */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-surface-container-lowest via-surface-container-lowest/75 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/75 to-transparent"
        />

        {/* Scrollable snap wheel */}
        <div
          ref={listRef}
          role="spinbutton"
          tabIndex={0}
          aria-label={label}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={display}
          data-autofocus={autoFocus ? true : undefined}
          data-testid={`time-wheel-${label.toLowerCase()}`}
          data-vaul-no-drag=""
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          style={{
            height: WHEEL_HEIGHT_PX,
            paddingTop: SPACER_PX,
            paddingBottom: SPACER_PX,
            touchAction: 'pan-y',
          }}
          className="no-scrollbar relative z-0 h-full w-full overflow-y-auto overscroll-contain snap-y snap-mandatory focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-grab active:cursor-grabbing"
        >
          {resolvedOptions.map((opt, idx) => {
            const distance = Math.abs(idx - selectedIndex);
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={opt.value}
                type="button"
                tabIndex={-1}
                aria-selected={isSelected}
                onClick={() => handleItemClick(idx, opt.value)}
                style={{ height: ITEM_HEIGHT_PX }}
                className={cn(
                  'flex w-full snap-center items-center justify-center tabular-nums transition-all duration-150 cursor-pointer',
                  isSelected
                    ? 'text-headline-md font-bold text-on-primary-container scale-105'
                    : distance === 1
                      ? 'text-title-md font-semibold text-on-surface/65'
                      : 'text-body-md font-medium text-on-surface-variant/35',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <IconButton
        icon="chevronDown"
        size="sm"
        className="text-on-surface-variant"
        tabIndex={-1}
        aria-label={t('pickers.time.increase', { unit })}
        onClick={onIncrement}
      />
    </div>
  );
}
