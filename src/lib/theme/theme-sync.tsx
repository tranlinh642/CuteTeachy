'use client';

import { useEffect, useState } from 'react';
import { getThemeColors, resolveActiveTheme } from './resolve-theme';
import { selectCurrentUser, usePreferencesStore, useSessionStore } from '@/stores';

/**
 * Đồng bộ data-theme và class theme-blue trên thẻ <html>
 * dựa trên giới tính của người dùng hoặc tùy chọn giao diện.
 * Chờ store rehydrate xong trước khi đồng bộ để tránh chớp màu (FOUC).
 */
export function ThemeSync() {
  const [isHydrated, setIsHydrated] = useState(false);
  const user = useSessionStore(selectCurrentUser);
  const themePreference = usePreferencesStore((s) => s.themePreference);

  useEffect(() => {
    if (useSessionStore.persist.hasHydrated() && usePreferencesStore.persist.hasHydrated()) {
      setIsHydrated(true);
      return;
    }

    const unsubSession = useSessionStore.persist.onFinishHydration(() => {
      if (usePreferencesStore.persist.hasHydrated()) setIsHydrated(true);
    });
    const unsubPref = usePreferencesStore.persist.onFinishHydration(() => {
      if (useSessionStore.persist.hasHydrated()) setIsHydrated(true);
    });

    return () => {
      unsubSession();
      unsubPref();
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const palette = resolveActiveTheme(user?.gender, themePreference);
    document.documentElement.setAttribute('data-theme', palette);
    if (palette === 'blue') {
      document.documentElement.classList.add('theme-blue');
    } else {
      document.documentElement.classList.remove('theme-blue');
    }
    const themeBg = getThemeColors(palette).background;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', themeBg);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = themeBg;
      document.head.appendChild(meta);
    }
  }, [isHydrated, user?.gender, themePreference]);

  return null;
}
