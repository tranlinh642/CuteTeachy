import type { TranslateFn, TranslationKey, TranslationParams } from '@/lib/i18n';
import { describe, expect, it } from 'vitest';
import {
  formatTeacherDisplayName,
  getAvatarName,
  getEffectiveDisplayName,
  getTeacherAvatarLabel,
  getTeacherHonorific,
  getTeacherRole,
  shouldShowFullNameSubtitle,
} from './user.selectors';

describe('user selectors', () => {
  const mockViT: TranslateFn = (key: TranslationKey, params?: TranslationParams): string => {
    if (key === 'profile.roles.male') return 'Thầy giáo';
    if (key === 'profile.roles.female') return 'Cô giáo';
    if (key === 'profile.roles.other') return 'Giáo viên';
    if (key === 'profile.honorifics.male') return 'Thầy';
    if (key === 'profile.honorifics.female') return 'Cô';
    if (key === 'profile.honorifics.other') return '';
    if (key === 'common.a11y.avatar') return `Ảnh đại diện của ${params?.name ?? ''}`;
    return key;
  };

  const mockEnT: TranslateFn = (key: TranslationKey, params?: TranslationParams): string => {
    if (key === 'profile.roles.male') return 'Teacher (Mr.)';
    if (key === 'profile.honorifics.male') return 'Mr.';
    if (key === 'profile.roles.female') return 'Teacher (Ms.)';
    if (key === 'profile.honorifics.female') return 'Ms.';
    if (key === 'common.a11y.avatar') return `Profile picture of ${params?.name ?? ''}`;
    return key;
  };

  it('resolves correct teacher roles and honorifics in Vietnamese and English', () => {
    expect(getTeacherRole('male', mockViT)).toBe('Thầy giáo');
    expect(getTeacherRole('female', mockViT)).toBe('Cô giáo');
    expect(getTeacherRole('other', mockViT)).toBe('Giáo viên');
    expect(getTeacherRole(undefined, mockViT)).toBe('Giáo viên');
    expect(getTeacherRole(null, mockViT)).toBe('Giáo viên');

    expect(getTeacherHonorific('male', mockViT)).toBe('Thầy');
    expect(getTeacherHonorific('female', mockViT)).toBe('Cô');
    expect(getTeacherHonorific('other', mockViT)).toBe('');
    expect(getTeacherHonorific(undefined, mockViT)).toBe('');
    expect(getTeacherHonorific(null, mockViT)).toBe('');

    expect(getTeacherRole('male', mockEnT)).toBe('Teacher (Mr.)');
    expect(getTeacherHonorific('male', mockEnT)).toBe('Mr.');
    expect(getTeacherRole(null, mockEnT)).toBe('profile.roles.other');
    expect(getTeacherHonorific(null, mockEnT)).toBe('profile.honorifics.other');
  });

  it('formats teacher display name with honorific', () => {
    expect(formatTeacherDisplayName('Nam', 'male', mockViT)).toBe('Thầy Nam');
    expect(formatTeacherDisplayName('Thầy Nam', 'male', mockViT)).toBe('Thầy Nam');
    expect(formatTeacherDisplayName('Linh', 'female', mockViT)).toBe('Cô Linh');
    expect(formatTeacherDisplayName('Cô Linh', 'female', mockViT)).toBe('Cô Linh');
    expect(formatTeacherDisplayName('Công', 'female', mockViT)).toBe('Cô Công');

    // Gender null preserves name without prefix
    expect(formatTeacherDisplayName('Nam', null, mockViT)).toBe('Nam');

    // Empty or whitespace display name returns role
    expect(formatTeacherDisplayName('', 'male', mockViT)).toBe('Thầy giáo');
    expect(formatTeacherDisplayName('   ', 'female', mockViT)).toBe('Cô giáo');
    expect(formatTeacherDisplayName(undefined, 'other', mockViT)).toBe('Giáo viên');
    expect(formatTeacherDisplayName('', null, mockViT)).toBe('Giáo viên');

    // English locale
    expect(formatTeacherDisplayName('John', 'male', mockEnT)).toBe('Mr. John');

    // Passing TeacherUser object directly
    expect(formatTeacherDisplayName({ displayName: 'Nam', gender: 'male' }, mockViT)).toBe('Thầy Nam');
    expect(formatTeacherDisplayName({ fullName: 'Nguyễn Văn Nam', gender: 'male' }, mockViT)).toBe('Thầy Nguyễn Văn Nam');
    expect(formatTeacherDisplayName({ displayName: '', fullName: '', gender: 'female' }, mockViT)).toBe('Cô giáo');
    expect(formatTeacherDisplayName({ displayName: 'Nam', gender: null }, mockViT)).toBe('Nam');
    expect(formatTeacherDisplayName({ displayName: '', gender: null }, mockViT)).toBe('Giáo viên');
    expect(formatTeacherDisplayName(null, mockViT)).toBe('Giáo viên');
  });

  it('resolves effective display name correctly with fallbacks', () => {
    expect(getEffectiveDisplayName({ displayName: 'Nam', fullName: 'Nguyễn Văn Nam' })).toBe('Nam');
    expect(getEffectiveDisplayName({ displayName: '  Nam  ', fullName: 'Nguyễn Văn Nam' })).toBe('Nam');
    expect(getEffectiveDisplayName({ displayName: '', fullName: 'Nguyễn Văn Nam' })).toBe('Nguyễn Văn Nam');
    expect(getEffectiveDisplayName({ displayName: '   ', fullName: '  Nguyễn Văn Nam  ' })).toBe('Nguyễn Văn Nam');
    expect(getEffectiveDisplayName({ displayName: '', fullName: '' })).toBe('');
    expect(getEffectiveDisplayName({ displayName: '  ', fullName: '  ' }, 'CT')).toBe('CT');
    expect(getEffectiveDisplayName(null, 'CT')).toBe('CT');
    expect(getEffectiveDisplayName(undefined, 'CT')).toBe('CT');
  });

  it('determines whether full name subtitle should be shown', () => {
    expect(shouldShowFullNameSubtitle({ displayName: 'Nam', fullName: 'Nguyễn Văn Nam' })).toBe(true);
    expect(shouldShowFullNameSubtitle({ displayName: 'Nam', fullName: 'Nam' })).toBe(false);
    expect(shouldShowFullNameSubtitle({ displayName: ' Nam ', fullName: 'Nam' })).toBe(false);
    expect(shouldShowFullNameSubtitle({ displayName: '', fullName: 'Nguyễn Văn Nam' })).toBe(false);
    expect(shouldShowFullNameSubtitle({ displayName: 'Nam', fullName: '' })).toBe(false);
    expect(shouldShowFullNameSubtitle({ displayName: '  ', fullName: 'Nguyễn Văn Nam' })).toBe(false);
    expect(shouldShowFullNameSubtitle(null)).toBe(false);
    expect(shouldShowFullNameSubtitle(undefined)).toBe(false);
  });

  it('resolves avatar name correctly with fallbacks', () => {
    expect(getAvatarName({ displayName: 'Nam', fullName: 'Nguyễn Văn Nam' })).toBe('Nam');
    expect(getAvatarName({ displayName: '  Nam  ', fullName: 'Nguyễn Văn Nam' })).toBe('Nam');
    expect(getAvatarName({ displayName: '', fullName: 'Nguyễn Văn Nam' })).toBe('Nguyễn Văn Nam');
    expect(getAvatarName({ displayName: '   ', fullName: '  Nguyễn Văn Nam  ' })).toBe('Nguyễn Văn Nam');
    expect(getAvatarName({ displayName: '', fullName: '' })).toBe('CT');
    expect(getAvatarName({ displayName: '  ', fullName: '  ' })).toBe('CT');
    expect(getAvatarName(null)).toBe('CT');
    expect(getAvatarName(undefined)).toBe('CT');
  });

  it('resolves avatar accessibility label with fallback to role', () => {
    expect(getTeacherAvatarLabel({ displayName: 'Nam', gender: 'male' }, mockViT)).toBe('Ảnh đại diện của Nam');
    expect(getTeacherAvatarLabel({ displayName: '', fullName: '', gender: 'female' }, mockViT)).toBe('Ảnh đại diện của Cô giáo');
    expect(getTeacherAvatarLabel({ displayName: '   ', fullName: '', gender: 'male' }, mockViT)).toBe('Ảnh đại diện của Thầy giáo');
    expect(getTeacherAvatarLabel({ displayName: '', fullName: '', gender: null }, mockViT)).toBe('Ảnh đại diện của Giáo viên');
    expect(getTeacherAvatarLabel(null, mockViT)).toBe('Ảnh đại diện của Giáo viên');
    expect(getTeacherAvatarLabel({ displayName: 'John', gender: 'male' }, mockEnT)).toBe('Profile picture of John');
  });
});
