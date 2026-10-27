import type { push as Schema } from '../vi/push';

export const push: typeof Schema = {
  dialog: {
    explanationTitle: 'Enable Reminders',
    explanationDescription:
      'CuteTeachy sends timely notifications before your classes and scheduled tasks, helping you stay ahead and never miss a lesson.',
    iosGuideTitle: 'Add to Home Screen first',
    iosGuideDescription:
      'On iOS devices (iPhone/iPad), Apple requires CuteTeachy to be added to your Home Screen before it can receive push notifications.',
    iosGuideInstruction:
      'Tap the Share button (the square with an arrow) in Safari, then select "Add to Home Screen". Open CuteTeachy from your Home Screen to enable notifications.',
    deniedTitle: 'Notifications are blocked',
    deniedDescription:
      'Your browser has blocked notifications for CuteTeachy. Please enable them in your browser settings to receive reminders.',
    deniedInstruction:
      'Click the lock or site settings icon in the address bar, find "Notifications", and change it to "Allow".',
    allowButton: 'Enable Notifications',
    dismissButton: 'Not now',
    closeButton: 'Close',
    understoodButton: 'Got it',
    subscribing: 'Registering...',
    successMessage: 'Notifications enabled successfully!',
    errorMessage: 'Failed to enable notifications. Please try again later.',
  },
  banner: {
    title: 'Never miss a class or task',
    description: 'Turn on reminders so CuteTeachy can alert you before every scheduled session!',
    enableButton: 'Turn On',
    dismissButton: 'Later',
  },
  settings: {
    pushEnabledLabel: 'Push Notifications',
    statusDenied: 'Blocked in browser settings',
    statusNotSupported: 'Not supported by browser',
    statusIosNeedsPwa: 'Requires Home Screen app',
  },
};
