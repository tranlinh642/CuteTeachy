/**
 * REST contract shared with the NestJS backend. Keep in sync with BE routes.
 */
export const ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
    google: '/auth/google',
    googleCallback: '/auth/google/callback',
    googleExchange: '/auth/google/exchange',
    profile: '/auth/profile',
    avatar: '/auth/profile/avatar',
    verifyEmail: '/auth/email/verify',
    resendEmailCode: '/auth/email/resend',
    forgotPassword: '/auth/password/forgot',
    resetPassword: '/auth/password/reset',
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
