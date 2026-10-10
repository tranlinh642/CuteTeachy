import type { profile as Schema } from '../vi/profile';

export const profile: typeof Schema = {
  title: 'Profile & Settings',
  pushNotifications: 'Push Notifications',
  themePreferences: 'Theme Preferences',
  accountDetails: 'Account Details',
  language: 'Language',
  languages: {
    vi: 'Tiếng Việt',
    en: 'English',
  },
  logout: 'Log Out',
  logoutConfirm: 'Are you sure you want to log out?',
  fullName: 'Full name',
  email: 'Email',
  jobTitle: 'Job title',
};
