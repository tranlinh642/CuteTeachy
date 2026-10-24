/** Field limits shared by schemas and UI (`maxLength` on inputs). */
export const LIMITS = {
  titleMax: 120,
  notesMax: 1000,
  noteContentMax: 5000,
  tagNameMax: 24,
  passwordMin: 8,
  passwordMax: 72,
} as const;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
