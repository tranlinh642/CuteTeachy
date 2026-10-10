'use client';

import { useTags } from '@cute-teachy/api';
import { resolveTags } from '@cute-teachy/core';
import type { ID, Tag } from '@cute-teachy/types';
import { useMemo } from 'react';

/** Chuyển danh sách id → Tag (bỏ qua id không tồn tại). */
export function useResolvedTags(tagIds: readonly ID[]): Tag[] {
  const { data: tags = [] } = useTags();
  return useMemo(() => resolveTags(tagIds, tags), [tagIds, tags]);
}
