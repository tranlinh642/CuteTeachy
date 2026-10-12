'use client';

import { selectCurrentUser, useSessionStore } from '@/stores';
import type { User } from '@/types';

/** Người dùng đang đăng nhập (null nếu chưa). */
export function useCurrentUser(): User | null {
  return useSessionStore(selectCurrentUser);
}
