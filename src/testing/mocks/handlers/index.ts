import type { MockRoute } from '../mock-router';
import { aiAssistantRoutes } from './ai-assistant.handler';
import { authRoutes } from './auth.handler';
import { classRoutes } from './class.handler';
import { classSessionRoutes } from './class-session.handler';
import { inspirationRoutes } from './inspiration.handler';
import { noteRoutes } from './note.handler';
import { notificationRoutes } from './notification.handler';
import { settingsRoutes } from './settings.handler';
import { tagRoutes } from './tag.handler';
import { taskRoutes } from './task.handler';
import { timetableSlotRoutes } from './timetable-slot.handler';
import { pushRoutes } from './push.handler';

export const mockRoutes: readonly MockRoute[] = [
  ...authRoutes,
  ...settingsRoutes,
  ...pushRoutes,
  ...notificationRoutes,
  ...aiAssistantRoutes,
  ...taskRoutes,
  ...noteRoutes,
  ...tagRoutes,
  ...timetableSlotRoutes,
  ...classSessionRoutes,
  ...classRoutes,
  ...inspirationRoutes,
];
