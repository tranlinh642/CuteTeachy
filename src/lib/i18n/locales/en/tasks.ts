import type { tasks as Schema } from '../vi/tasks';

export const tasks: typeof Schema = {
  editor: {
    createTitle: 'New Task',
    editTitle: 'Edit Task',
    nameLabel: 'Task Name',
    namePlaceholder: 'What needs to be done?',
    dateLabel: 'Date',
    timeLabel: 'Time',
    categoryLabel: 'Category',
    priorityLabel: 'High priority',
    tagsLabel: 'Tags',
    notesLabel: 'Notes (Optional)',
    notesPlaceholder: 'Add extra details here…',
    save: 'Save Task',
  },
  category: {
    school: 'School',
    personal: 'Personal',
  },
  priority: {
    normal: 'Normal',
    high: 'Urgent',
  },
  markDone: 'Mark “{{title}}” as done',
  markUndone: 'Mark “{{title}}” as not done',
  deleteConfirm: 'Delete task “{{title}}”?',
  created: 'Task created',
};
