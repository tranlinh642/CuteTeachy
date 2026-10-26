import type { tags as Schema } from '../vi/tags';

export const tags: typeof Schema = {
  editor: {
    title: 'Create New Tag',
    editTitle: 'Edit Tag',
    nameLabel: 'Tag Name',
    namePlaceholder: 'e.g., Exam Prep…',
    colorLabel: 'Select Color',
    submit: 'Create',
    save: 'Save',
    delete: 'Delete tag',
  },
  deleteConfirmTitle: 'Delete this tag?',
  deleteConfirmMessage: 'This tag will be removed from all associated tasks and notes.',
  tones: {
    pink: 'Soft pink',
    blue: 'Baby blue',
    beige: 'Warm beige',
    lavender: 'Lavender',
    mint: 'Mint',
    rose: 'Rose',
  },
  selectTone: 'Select {{tone}} color',
  addTag: 'Add tag',
  editTag: 'Edit tag {{name}}',
};
