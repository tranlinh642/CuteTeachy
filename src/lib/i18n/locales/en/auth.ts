import type { auth as Schema } from '../vi/auth';

export const auth: typeof Schema = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to start a calm teaching day',
    emailLabel: 'Email',
    emailPlaceholder: 'name@school.edu',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    remember: 'Remember me',
    forgotPassword: 'Forgot password?',
    submit: 'Sign in',
    noAccount: "Don't have an account?",
    signUp: 'Sign up',
    demoHint: 'Demo account: {{email}} / {{password}}',
  },
  errors: {
    invalidCredentials: 'Incorrect email or password',
    sessionExpired: 'Your session has expired, please sign in again',
    emailTaken: 'This email is already in use',
    onboardingRequired: 'Please complete your onboarding profile',
    emailNotVerified: 'Email has not been verified',
    invalidCode: 'Invalid or expired code',
  },
};
