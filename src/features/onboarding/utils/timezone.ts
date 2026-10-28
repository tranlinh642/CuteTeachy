export function isValidIanaTimeZone(tz: unknown): boolean {
  if (typeof tz !== 'string' || !tz.trim()) {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads the device IANA time zone using `Intl.DateTimeFormat().resolvedOptions().timeZone`.
 * Falls back to 'Asia/Ho_Chi_Minh' if unavailable or invalid per SPEC-003.
 */
export function getDeviceTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && isValidIanaTimeZone(tz)) {
      return tz;
    }
  } catch {
    // fallback
  }
  return 'Asia/Ho_Chi_Minh';
}
