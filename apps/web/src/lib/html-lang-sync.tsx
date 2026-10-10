'use client';

import { useTranslation } from '@cute-teachy/i18n';
import { useEffect } from 'react';

/** Đồng bộ `<html lang>` và tiêu đề tab với ngôn ngữ hiện tại. */
export function HtmlLangSync() {
  const { locale, t } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = `${t('common.appName')} – ${t('common.tagline')}`;
  }, [locale, t]);

  return null;
}
