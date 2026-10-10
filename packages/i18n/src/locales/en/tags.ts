import type { tags as Schema } from '../vi/tags';

export const tags: typeof Schema = {
  editor: {
    title: 'Create New Tag',
    nameLabel: 'Tag Name',
    namePlaceholder: 'e.g., Exam Prep…',
    colorLabel: 'Select Color',
    submit: 'Create',
  },
  tones: {
    pink: 'Soft pink',
    blue: 'Baby blue',
    beige: 'Warm beige',
    lavender: 'Lavender',
    mint: 'Mint',
    rose: 'Rose',
  },
  selectTone: 'Select {{tone}} color',
};
