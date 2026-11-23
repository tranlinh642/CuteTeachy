import type { ID, ISODate, ISODateTime, ScheduleCategory, TimeOfDay, Tone } from './common.interface';

export type AiDraftItemKind = 'timetable_slot' | 'class_session' | 'task';

export type AiDraftItemAction = 'create' | 'update' | 'delete' | 'cancel';

export type AiConflictStrategy =
  | 'replace_conflicts'
  | 'skip_conflicts'
  | 'replace_all_timetable';

export interface AiScheduleDraftConflict {
  readonly slotId: ID;
  readonly subject: string;
  readonly startTime: TimeOfDay;
  readonly endTime: TimeOfDay;
}

export interface AiScheduleDraftItem {
  readonly id: ID;
  readonly kind: AiDraftItemKind;
  readonly action?: AiDraftItemAction;
  readonly targetSlotId?: ID | null;
  readonly targetSessionId?: ID | null;
  readonly targetSummary?: string | null;
  readonly category: ScheduleCategory;
  readonly titleOrSubject: string;
  readonly grade?: string | null;
  readonly room?: string | null;
  readonly weekday?: number | null; // 1..7 cho timetable_slot
  readonly date?: ISODate | null; // YYYY-MM-DD cho class_session hoặc task
  readonly startTime?: TimeOfDay | null; // HH:mm
  readonly endTime?: TimeOfDay | null; // HH:mm (cho timetable_slot / class_session)
  readonly effectiveFrom?: ISODate | null; // YYYY-MM-DD cho timetable_slot
  readonly effectiveTo?: ISODate | null;
  readonly tone?: Tone;
  readonly notes?: string | null;
  readonly conflict?: AiScheduleDraftConflict | null;
}

export interface AiScheduleDraftSummary {
  readonly createdCount: number;
  readonly replacedCount: number;
  readonly skippedCount: number;
  readonly updatedCount?: number;
  readonly deletedCount?: number;
  readonly cancelledCount?: number;
}

export interface AiScheduleDraft {
  readonly status: 'pending' | 'applied';
  readonly appliedAt?: ISODateTime | null;
  readonly conflictStrategy?: AiConflictStrategy | null;
  readonly summary?: AiScheduleDraftSummary | null;
  readonly items: AiScheduleDraftItem[];
}

export interface AiChatMessage {
  readonly id: ID;
  readonly accountId?: ID;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly imageUrl?: string | null;
  readonly imageExpiresAt?: ISODateTime | null;
  readonly draft?: AiScheduleDraft | null;
  readonly createdAt: ISODateTime;
}

export interface SendAiMessageInput {
  readonly message?: string;
  readonly image?: File | Blob | null;
}

export interface SendAiMessageResponse {
  readonly userMessage: AiChatMessage;
  readonly assistantMessage: AiChatMessage;
}

export interface ApplyAiDraftInput {
  readonly conflictStrategy: AiConflictStrategy;
  readonly items?: AiScheduleDraftItem[];
}

export interface ApplyAiDraftResponse {
  readonly message: AiChatMessage;
  readonly summary: AiScheduleDraftSummary;
}

export interface ListAiChatMessagesResponse {
  readonly items: AiChatMessage[];
}
