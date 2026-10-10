import type { common as Schema } from '../vi/common';

export const common: typeof Schema = {
  appName: 'CuteTeachy',
  tagline: 'A gentle planner for educators',
  actions: {
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    add: 'Add',
    back: 'Back',
    confirm: 'Confirm',
    retry: 'Try again',
    search: 'Search',
    seeAll: 'See all',
    more: 'More options',
  },
  states: {
    loading: 'Loading…',
    empty: 'Nothing here yet',
    error: 'Something went wrong',
  },
  a11y: {
    avatar: "{{name}}'s avatar",
    openMenu: 'Open menu',
    notifications: 'Notifications',
    settings: 'Settings',
  },
};
