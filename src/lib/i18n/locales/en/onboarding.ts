import type { onboarding as Schema } from '../vi/onboarding';

export const onboarding: typeof Schema = {
  title: 'Complete Your Profile',
  subtitle: 'Tell CuteTeachy a little about yourself to personalize your theme and greetings',
  fullNameLabel: 'Full name',
  fullNamePlaceholder: 'Enter your full name…',
  displayNameLabel: 'Display name',
  displayNamePlaceholder: 'Short name (e.g. Linh, Nam)',
  displayNameHint: 'Used for daily greetings',
  titleLabel: 'Professional Title',
  titlePlaceholder: 'e.g. Biology Teacher, Math Teacher…',
  genderLabel: 'Gender',
  genderHint: 'Gender helps determine honorifics and adaptive theme colors',
  genders: {
    female: 'Ms. (Female)',
    male: 'Mr. (Male)',
    other: 'Other / Neutral',
  },
  submit: 'Get Started',
  saving: 'Saving…',
  logout: 'Log Out',
  logoutConfirm: 'Are you sure you want to log out?',
};
