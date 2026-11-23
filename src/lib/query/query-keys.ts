import type { DateRange } from '@/lib/api';

/**
 * Query-key factory – the only place keys are defined, so invalidation is
 * consistent across web & mobile.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: ['auth', 'me'] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (range?: DateRange) => ['tasks', 'list', range ?? 'all'] as const,
  },
  notes: {
    all: ['notes'] as const,
    list: (filters?: { q?: string; tagId?: string }) =>
      filters?.q || filters?.tagId
        ? (['notes', 'list', { q: filters.q ?? '', tagId: filters.tagId ?? '' }] as const)
        : (['notes', 'list'] as const),
    infinite: (filters?: { q?: string; tagId?: string }) =>
      ['notes', 'infinite', { q: filters?.q ?? '', tagId: filters?.tagId ?? '' }] as const,
    syncCheckpoint: ['notes', 'sync-checkpoint'] as const,
  },
  tags: {
    all: ['tags'] as const,
  },
  classes: {
    all: ['classes'] as const,
    list: (range: DateRange) => ['classes', 'list', range] as const,
  },
  timetableSlots: {
    all: ['timetable-slots'] as const,
    list: () => ['timetable-slots', 'list'] as const,
  },
  classSessions: {
    all: ['class-sessions'] as const,
    list: (range: DateRange) => ['class-sessions', 'list', range] as const,
  },
  inspirations: {
    today: ['inspirations', 'today'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (params?: { unreadOnly?: boolean; limit?: number }) =>
      params?.unreadOnly !== undefined || params?.limit !== undefined
        ? (['notifications', 'list', params] as const)
        : (['notifications', 'list'] as const),
  },
  aiAssistant: {
    all: ['ai-assistant'] as const,
    messages: (params?: { limit?: number }) =>
      params?.limit !== undefined
        ? (['ai-assistant', 'messages', params] as const)
        : (['ai-assistant', 'messages'] as const),
  },
} as const;
