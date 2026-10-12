import type { User } from '@/types';

/** Demo login for the mock backend (shown as a hint on the login screen). */
export const MOCK_DEMO_CREDENTIALS = {
  email: 'linh@cuteteachy.vn',
  password: '123456',
} as const;

export const seedUser: User = {
  id: 'user-linh',
  fullName: 'Nguyễn Thùy Linh',
  displayName: 'Linh',
  email: MOCK_DEMO_CREDENTIALS.email,
  title: 'Giáo viên Sinh học',
  gender: 'female',
};
