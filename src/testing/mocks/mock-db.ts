import type { ClassSession, Inspiration, Note, Tag, Task, User } from '@/types';
import type { SoftDeletedRecord } from './mock-sync';
import { seedClasses } from './seed/class.seed';
import { seedInspirations } from './seed/inspiration.seed';
import { seedNotes } from './seed/note.seed';
import { createSeedContext } from './seed/seed-context';
import { seedTags } from './seed/tag.seed';
import { seedTasks } from './seed/task.seed';
import { seedUser } from './seed/user.seed';

export interface MockDb {
  user: User;
  tags: Tag[];
  tasks: Task[];
  notes: Note[];
  classes: ClassSession[];
  inspirations: Inspiration[];
  tombstones?: {
    tags: SoftDeletedRecord[];
    tasks: SoftDeletedRecord[];
    notes: SoftDeletedRecord[];
  };
}

export const createMockDb = (today: Date = new Date()): MockDb => {
  const context = createSeedContext(today);
  return {
    user: seedUser,
    tags: seedTags(),
    tasks: seedTasks(context),
    notes: seedNotes(context),
    classes: seedClasses(context),
    inspirations: seedInspirations(),
    tombstones: {
      tags: [],
      tasks: [],
      notes: [],
    },
  };
};
