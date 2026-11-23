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
  updateTitle: 'New version available',
  updateDescription: 'Tap update to load the latest interface and fixes without losing your data.',
  updateButton: 'Update now',
  updatingButton: 'Updating…',
  checkUpdateButton: 'Check for updates',
  checkingUpdate: 'Checking…',
  upToDate: 'You are on the latest version',
  updateUnsupported: 'Automatic PWA updates are not available in this browser',
  closeUpdateBanner: 'Dismiss update banner',
};
