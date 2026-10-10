'use client';

import { selectCurrentUser, useSessionStore } from '@cute-teachy/core';
import type { User } from '@cute-teachy/types';

/** Người dùng đang đăng nhập (null nếu chưa). */
export function useCurrentUser(): User | null {
  return useSessionStore(selectCurrentUser);
}
