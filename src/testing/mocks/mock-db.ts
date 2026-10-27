import type { ClassSession, Inspiration, Note, Settings, Tag, Task, TimetableSlot, User } from '@/types';
import type { SessionOverride } from '@/utils';
import type { SoftDeletedRecord } from './mock-sync';
import { seedClasses } from './seed/class.seed';
import { seedInspirations } from './seed/inspiration.seed';
import { seedNotes } from './seed/note.seed';
import { createSeedContext } from './seed/seed-context';
import { seedTags } from './seed/tag.seed';
import { seedTasks } from './seed/task.seed';
import { seedAdhocSessions, seedSessionOverrides, seedTimetableSlots } from './seed/timetable.seed';
import { seedUser } from './seed/user.seed';

export const DEFAULT_MOCK_SETTINGS: Settings = {
  locale: 'vi',
  timeZone: 'Asia/Ho_Chi_Minh',
  pushEnabled: true,
  reminderLeadMinutes: 15,
};

export interface MockDb {
  user: User;
  settings: Settings;
  tags: Tag[];
  tasks: Task[];
  notes: Note[];
  timetableSlots: TimetableSlot[];
  sessionOverrides: SessionOverride[];
  adhocSessions: ClassSession[];
  classes: ClassSession[];
  inspirations: Inspiration[];
  tombstones?: {
    tags: SoftDeletedRecord[];
    tasks: SoftDeletedRecord[];
    notes: SoftDeletedRecord[];
    timetableSlots?: SoftDeletedRecord[];
    classSessions?: SoftDeletedRecord[];
  };
}

export const createMockDb = (today: Date = new Date()): MockDb => {
  const context = createSeedContext(today);
  const timetableSlots = seedTimetableSlots();
  const sessionOverrides = seedSessionOverrides(context);
  const adhocSessions = seedAdhocSessions(context);
  const classes = seedClasses(context);

  return {
    user: seedUser,
    settings: { ...DEFAULT_MOCK_SETTINGS },
    tags: seedTags(),
    tasks: seedTasks(context),
    notes: seedNotes(context),
    timetableSlots,
    sessionOverrides,
    adhocSessions,
    classes,
    inspirations: seedInspirations(),
    tombstones: {
      tags: [],
      tasks: [],
      notes: [],
      timetableSlots: [],
      classSessions: [],
    },
  };
};
