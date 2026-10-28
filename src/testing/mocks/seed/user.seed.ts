import type { User } from '@/types';

/** Demo login for the mock backend (shown as a hint on the login screen). */
export const MOCK_DEMO_CREDENTIALS = {
  email: 'linh@cuteteachy.vn',
  password: 'password123',
} as const;

export const seedUser: User = {
  id: 'user-linh',
  email: MOCK_DEMO_CREDENTIALS.email,
  emailVerified: true,
  loginProviders: ['password'],
  fullName: 'Nguyễn Thùy Linh',
  displayName: 'Linh',
  title: 'Giáo viên Sinh học',
  gender: 'female',
  onboardingCompletedAt: '2026-09-01T08:00:00.000Z',
};
