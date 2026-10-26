import type { AxiosInstance } from 'axios';
import { createAuthService } from './auth.service';
import { createClassService } from './class.service';
import { createInspirationService } from './inspiration.service';
import { createNoteService } from './note.service';
import { createSettingsService } from './settings.service';
import { createTagService } from './tag.service';
import { createTaskService } from './task.service';

export const createServices = (http: AxiosInstance) => ({
  auth: createAuthService(http),
  settings: createSettingsService(http),
  tasks: createTaskService(http),
  notes: createNoteService(http),
  tags: createTagService(http),
  classes: createClassService(http),
  inspirations: createInspirationService(http),
});

export type Services = ReturnType<typeof createServices>;
