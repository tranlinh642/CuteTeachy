import type { MockRoute } from '../mock-router';
import { authRoutes } from './auth.handler';
import { classRoutes } from './class.handler';
import { classSessionRoutes } from './class-session.handler';
import { inspirationRoutes } from './inspiration.handler';
import { noteRoutes } from './note.handler';
import { settingsRoutes } from './settings.handler';
import { tagRoutes } from './tag.handler';
import { taskRoutes } from './task.handler';
import { timetableSlotRoutes } from './timetable-slot.handler';

export const mockRoutes: readonly MockRoute[] = [
  ...authRoutes,
  ...settingsRoutes,
  ...taskRoutes,
  ...noteRoutes,
  ...tagRoutes,
  ...timetableSlotRoutes,
  ...classSessionRoutes,
  ...classRoutes,
  ...inspirationRoutes,
];
