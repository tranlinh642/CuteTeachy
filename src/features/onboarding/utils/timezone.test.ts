import { describe, expect, it } from 'vitest';
import { getDeviceTimeZone, isValidIanaTimeZone } from './timezone';

describe('onboarding timezone utility', () => {
  describe('isValidIanaTimeZone', () => {
    it('returns true for valid IANA time zones', () => {
      expect(isValidIanaTimeZone('Asia/Ho_Chi_Minh')).toBe(true);
      expect(isValidIanaTimeZone('America/New_York')).toBe(true);
      expect(isValidIanaTimeZone('Europe/London')).toBe(true);
      expect(isValidIanaTimeZone('UTC')).toBe(true);
    });

    it('returns false for invalid time zones or non-strings', () => {
      expect(isValidIanaTimeZone('Invalid/Zone')).toBe(false);
      expect(isValidIanaTimeZone('')).toBe(false);
      expect(isValidIanaTimeZone(null)).toBe(false);
      expect(isValidIanaTimeZone(undefined)).toBe(false);
      expect(isValidIanaTimeZone(123)).toBe(false);
    });
  });

  describe('getDeviceTimeZone', () => {
    it('returns resolvedOptions timeZone when valid', () => {
      const tz = getDeviceTimeZone();
      expect(typeof tz).toBe('string');
      expect(isValidIanaTimeZone(tz)).toBe(true);
    });

    it('falls back to Asia/Ho_Chi_Minh if Intl throws or returns invalid zone', () => {
      const originalDateTimeFormat = Intl.DateTimeFormat;
      try {
        const mockDateTimeFormat = ((_locale?: string, options?: { timeZone?: string }) => {
          if (options?.timeZone === 'Invalid_Zone_123') {
            throw new RangeError('Invalid time zone specified');
          }
          return {
            resolvedOptions: () => ({ timeZone: 'Invalid_Zone_123' }),
          };
        }) as unknown as typeof Intl.DateTimeFormat;

        Intl.DateTimeFormat = mockDateTimeFormat;
        expect(getDeviceTimeZone()).toBe('Asia/Ho_Chi_Minh');
      } finally {
        Intl.DateTimeFormat = originalDateTimeFormat;
      }
    });
  });
});
