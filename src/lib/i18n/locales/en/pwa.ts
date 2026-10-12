import type { pwa as Schema } from '../vi/pwa';

export const pwa: typeof Schema = {
  installTitle: 'Install {{name}}',
  installDescription: 'Add to home screen for full-screen experience and offline access!',
  installButton: 'Install now',
  installGuideButton: 'How to install',
  dismissButton: 'Maybe later',
  closeBanner: 'Dismiss install banner',
  iosGuide: 'Tap the Share button in Safari, then tap "Add to Home Screen".',
  offlineNotice: 'Offline Mode: You can still view your schedule and notes. Changes will sync once back online.',
};
