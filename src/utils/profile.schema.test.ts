import { describe, expect, it } from 'vitest';
import { profileSchema } from './profile.schema';

describe('profileSchema', () => {
  it('accepts valid profile inputs with female, male, or other', () => {
    const validFemale = profileSchema.safeParse({
      fullName: 'Nguyễn Thùy Linh',
      displayName: 'Linh',
      title: 'Giáo viên Sinh học',
      gender: 'female',
    });
    expect(validFemale.success).toBe(true);

    const validMale = profileSchema.safeParse({
      fullName: 'Nguyễn Văn Nam',
      displayName: 'Nam',
      title: 'Thầy giáo Hóa học',
      gender: 'male',
    });
    expect(validMale.success).toBe(true);

    const validOther = profileSchema.safeParse({
      fullName: 'Trần Minh Anh',
      displayName: 'Minh Anh',
      title: '',
      gender: 'other',
    });
    expect(validOther.success).toBe(true);
  });

  it('rejects short fullName (<2 characters)', () => {
    const res = profileSchema.safeParse({
      fullName: 'A',
      displayName: 'A',
      gender: 'male',
    });
    expect(res.success).toBe(false);
  });

  it('rejects overly long fullName (>50 characters)', () => {
    const res = profileSchema.safeParse({
      fullName: 'A'.repeat(51),
      displayName: 'Nam',
      gender: 'male',
    });
    expect(res.success).toBe(false);

    // Exact 50 chars is accepted
    const boundary = profileSchema.safeParse({
      fullName: 'A'.repeat(50),
      displayName: 'Nam',
      gender: 'male',
    });
    expect(boundary.success).toBe(true);
  });

  it('rejects empty displayName', () => {
    const res = profileSchema.safeParse({
      fullName: 'Nguyễn Văn Nam',
      displayName: '',
      gender: 'male',
    });
    expect(res.success).toBe(false);
  });

  it('rejects overly long displayName (>20 characters)', () => {
    const res = profileSchema.safeParse({
      fullName: 'Nguyễn Văn Nam',
      displayName: 'A'.repeat(21),
      gender: 'male',
    });
    expect(res.success).toBe(false);

    // Exact 20 chars is accepted
    const boundary = profileSchema.safeParse({
      fullName: 'Nguyễn Văn Nam',
      displayName: 'A'.repeat(20),
      gender: 'male',
    });
    expect(boundary.success).toBe(true);
  });

  it('rejects overly long title (>50 characters)', () => {
    const res = profileSchema.safeParse({
      fullName: 'Nguyễn Văn Nam',
      displayName: 'Nam',
      title: 'A'.repeat(51),
      gender: 'male',
    });
    expect(res.success).toBe(false);

    // Exact 50 chars is accepted
    const boundary = profileSchema.safeParse({
      fullName: 'Nguyễn Văn Nam',
      displayName: 'Nam',
      title: 'A'.repeat(50),
      gender: 'male',
    });
    expect(boundary.success).toBe(true);
  });

  it('rejects invalid gender option', () => {
    const res = profileSchema.safeParse({
      fullName: 'Nguyễn Văn Nam',
      displayName: 'Nam',
      gender: 'unknown',
    });
    expect(res.success).toBe(false);
  });
});
