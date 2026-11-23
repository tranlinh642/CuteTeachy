'use client';

import { useEffect, useState } from 'react';

export interface MobileKeyboardState {
  readonly isKeyboardOpen: boolean;
  readonly visualViewportHeight: number | null;
}

const MOBILE_MAX_WIDTH = 767;
const KEYBOARD_SHRINK_THRESHOLD_PX = 120;

const TEXT_INPUT_TYPES = new Set([
  '',
  'text',
  'search',
  'email',
  'password',
  'tel',
  'url',
  'number',
]);

export function isTextEntryElement(el: Element | null): boolean {
  if (!el || typeof el.tagName !== 'string') return false;
  const tag = el.tagName.toUpperCase();
  if (tag === 'TEXTAREA') return true;
  if (tag === 'INPUT') {
    const type = (el.getAttribute('type') ?? 'text').toLowerCase();
    return TEXT_INPUT_TYPES.has(type);
  }
  return el.getAttribute('contenteditable') === 'true';
}

/**
 * Theo dõi trạng thái bàn phím ảo trên mobile (iOS Safari/PWA & Android):
 * - Kết hợp `window.visualViewport` và sự kiện focus vào ô nhập liệu để ẩn thanh điều hướng dưới
 *   và co gọn chiều cao vùng chat khớp chính xác phần màn hình phía trên bàn phím.
 */
export function useMobileKeyboard(): MobileKeyboardState {
  const [state, setState] = useState<MobileKeyboardState>({
    isKeyboardOpen: false,
    visualViewportHeight: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let baselineHeight = window.innerHeight;
    let focusTimer: ReturnType<typeof setTimeout> | null = null;
    let isTextFocused = isTextEntryElement(document.activeElement);

    const evaluate = () => {
      const isMobile = window.innerWidth <= MOBILE_MAX_WIDTH;
      if (!isMobile) {
        setState((prev) =>
          prev.isKeyboardOpen || prev.visualViewportHeight !== null
            ? { isKeyboardOpen: false, visualViewportHeight: null }
            : prev,
        );
        return;
      }

      const vv = window.visualViewport;
      const vvHeight = vv ? Math.round(vv.height) : window.innerHeight;

      if (!isTextFocused && vvHeight > baselineHeight) {
        baselineHeight = vvHeight;
      }

      const shrunkByViewport =
        Math.max(window.innerHeight, baselineHeight) - vvHeight > KEYBOARD_SHRINK_THRESHOLD_PX;
      const nextOpen = isTextFocused || shrunkByViewport;

      setState((prev) => {
        const nextHeight = nextOpen ? vvHeight : null;
        if (prev.isKeyboardOpen === nextOpen && prev.visualViewportHeight === nextHeight) {
          return prev;
        }
        return {
          isKeyboardOpen: nextOpen,
          visualViewportHeight: nextHeight,
        };
      });
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (focusTimer) {
        clearTimeout(focusTimer);
        focusTimer = null;
      }
      if (isTextEntryElement(event.target instanceof Element ? event.target : null)) {
        isTextFocused = true;
        evaluate();
      }
    };

    const handleFocusOut = () => {
      if (focusTimer) clearTimeout(focusTimer);
      focusTimer = setTimeout(() => {
        isTextFocused = isTextEntryElement(document.activeElement);
        evaluate();
      }, 80);
    };

    const handleOrientationChange = () => {
      baselineHeight = window.innerHeight;
      evaluate();
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    window.addEventListener('resize', evaluate);
    window.addEventListener('orientationchange', handleOrientationChange);

    const vv = window.visualViewport;
    vv?.addEventListener('resize', evaluate);
    vv?.addEventListener('scroll', evaluate);

    evaluate();

    return () => {
      if (focusTimer) clearTimeout(focusTimer);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('resize', evaluate);
      window.removeEventListener('orientationchange', handleOrientationChange);
      vv?.removeEventListener('resize', evaluate);
      vv?.removeEventListener('scroll', evaluate);
    };
  }, []);

  return state;
}
