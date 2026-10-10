/**
 * REST contract shared with the NestJS backend. Keep in sync with BE routes.
 */
export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  tasks: {
    root: '/tasks',
    byId: (id: string) => `/tasks/${id}`,
  },
  notes: {
    root: '/notes',
    byId: (id: string) => `/notes/${id}`,
  },
  tags: {
    root: '/tags',
    byId: (id: string) => `/tags/${id}`,
  },
  classes: {
    root: '/classes',
  },
  inspirations: {
    today: '/inspirations/today',
  },
} as const;
