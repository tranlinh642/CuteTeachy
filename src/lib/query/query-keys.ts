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
  tasks: {
    all: ['tasks'] as const,
    list: (range?: DateRange) => ['tasks', 'list', range ?? 'all'] as const,
  },
  notes: {
    all: ['notes'] as const,
    list: () => ['notes', 'list'] as const,
  },
  tags: {
    all: ['tags'] as const,
  },
  classes: {
    all: ['classes'] as const,
    list: (range: DateRange) => ['classes', 'list', range] as const,
  },
  inspirations: {
    today: ['inspirations', 'today'] as const,
  },
} as const;
