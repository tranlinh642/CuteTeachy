import type { AxiosInstance } from 'axios';
import { createAuthService } from './auth.service';
import { createClassService } from './class.service';
import { createClassSessionService } from './class-session.service';
import { createInspirationService } from './inspiration.service';
import { createNoteService } from './note.service';
import { createSettingsService } from './settings.service';
import { createTagService } from './tag.service';
import { createTaskService } from './task.service';
import { createTimetableSlotService } from './timetable-slot.service';

export const createServices = (http: AxiosInstance) => ({
  auth: createAuthService(http),
  settings: createSettingsService(http),
  tasks: createTaskService(http),
  notes: createNoteService(http),
  tags: createTagService(http),
  classes: createClassService(http),
  timetableSlots: createTimetableSlotService(http),
  classSessions: createClassSessionService(http),
  inspirations: createInspirationService(http),
});

export type Services = ReturnType<typeof createServices>;
