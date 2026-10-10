/**
 * Đường dẫn route tập trung – features điều hướng qua đây thay vì chuỗi rải rác.
 * Modal nhận `id` để chỉnh sửa, `date` để điền sẵn ngày.
 */
export const ROUTES = {
  home: '/',
  calendar: '/calendar',
  notes: '/notes',
  profile: '/profile',
  login: '/login',
  newTask: '/new-task',
  newNote: '/new-note',
  newTag: '/new-tag',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
