import { describe, expect, it } from 'vitest';
import type { User } from '@/types';
import { getInitialOnboardingValues, validateOnboardingValues } from './onboarding-helpers';

describe('onboarding-helpers', () => {
  describe('getInitialOnboardingValues', () => {
    it('prefills fullName and displayName from user while keeping gender strictly null', () => {
      const user: User = {
        id: 'u-123',
        email: 'teacher@school.edu.vn',
        emailVerified: true,
        loginProviders: ['google'],
        fullName: 'Nguyễn Thị Hoa',
        displayName: 'Hoa',
        title: 'Giáo viên Văn',
        gender: null,
        onboardingCompletedAt: null,
      };

      const initial = getInitialOnboardingValues(user);
      expect(initial.fullName).toBe('Nguyễn Thị Hoa');
      expect(initial.displayName).toBe('Hoa');
      expect(initial.title).toBe('Giáo viên Văn');
      // Gender MUST NOT be defaulted
      expect(initial.gender).toBeNull();
    });

    it('returns empty strings and null gender when user fields are empty or undefined', () => {
      const initial = getInitialOnboardingValues(null);
      expect(initial.fullName).toBe('');
      expect(initial.displayName).toBe('');
      expect(initial.title).toBe('');
      expect(initial.gender).toBeNull();
    });

    it('forces gender to null even if user object previously contained a gender', () => {
      const user = {
        id: 'u-123',
        email: 'teacher@school.edu.vn',
        emailVerified: true,
        loginProviders: ['password'],
        fullName: 'Trần Nam',
        displayName: 'Nam',
        gender: 'male',
        onboardingCompletedAt: null,
      } as unknown as User;

      const initial = getInitialOnboardingValues(user);
      expect(initial.gender).toBeNull();
    });
  });

  describe('validateOnboardingValues', () => {
    it('fails when gender is null or not selected', () => {
      const result = validateOnboardingValues({
        fullName: 'Nguyễn Văn Nam',
        displayName: 'Nam',
        title: '',
        gender: null,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.gender).toBeDefined();
        expect(result.errors.gender?.key).toBe('validation.required');
      }
    });

    it('fails when fullName or displayName is invalid', () => {
      const result = validateOnboardingValues({
        fullName: 'A', // too short (< 2)
        displayName: '', // required
        title: '',
        gender: 'female',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.fullName).toBeDefined();
        expect(result.errors.displayName).toBeDefined();
      }
    });

    it('succeeds with valid trimmed values and selected gender', () => {
      const result = validateOnboardingValues({
        fullName: '  Nguyễn Văn Nam  ',
        displayName: '  Nam  ',
        title: '  Thầy giáo Toán  ',
        gender: 'male',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe('Nguyễn Văn Nam');
        expect(result.data.displayName).toBe('Nam');
        expect(result.data.title).toBe('Thầy giáo Toán');
        expect(result.data.gender).toBe('male');
      }
    });
  });
});
