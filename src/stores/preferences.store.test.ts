import { beforeEach, describe, expect, it } from 'vitest';
import { usePreferencesStore } from './preferences.store';

describe('usePreferencesStore (SPEC-003 & S3-FE-05)', () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      themePreference: 'auto',
      pwaInstallDismissed: false,
    });
  });

  it('initializes with default values: themePreference=auto, pwaInstallDismissed=false', () => {
    const state = usePreferencesStore.getState();
    expect(state.themePreference).toBe('auto');
    expect(state.pwaInstallDismissed).toBe(false);

    // Verify that locale and pushNotifications are NOT in the local preferences store (server-owned per SPEC-003)
    expect((state as unknown as Record<string, unknown>).locale).toBeUndefined();
    expect((state as unknown as Record<string, unknown>).pushNotifications).toBeUndefined();
  });

  it('updates theme preference without touching other state', () => {
    usePreferencesStore.getState().setThemePreference('blue');
    expect(usePreferencesStore.getState().themePreference).toBe('blue');

    usePreferencesStore.getState().setThemePreference('pink');
    expect(usePreferencesStore.getState().themePreference).toBe('pink');

    usePreferencesStore.getState().setThemePreference('auto');
    expect(usePreferencesStore.getState().themePreference).toBe('auto');
  });

  it('updates pwaInstallDismissed flag', () => {
    usePreferencesStore.getState().setPwaInstallDismissed(true);
    expect(usePreferencesStore.getState().pwaInstallDismissed).toBe(true);

    usePreferencesStore.getState().setPwaInstallDismissed(false);
    expect(usePreferencesStore.getState().pwaInstallDismissed).toBe(false);
  });
});
