import type { MockRoute } from '../mock-router';
import { authRoutes } from './auth.handler';
import { classRoutes } from './class.handler';
import { inspirationRoutes } from './inspiration.handler';
import { noteRoutes } from './note.handler';
import { settingsRoutes } from './settings.handler';
import { tagRoutes } from './tag.handler';
import { taskRoutes } from './task.handler';

export const mockRoutes: readonly MockRoute[] = [
  ...authRoutes,
  ...settingsRoutes,
  ...taskRoutes,
  ...noteRoutes,
  ...tagRoutes,
  ...classRoutes,
  ...inspirationRoutes,
];
