import type {
  AiChatMessage,
  AiConflictStrategy,
  AiScheduleDraft,
  AiScheduleDraftItem,
  AiScheduleDraftSummary,
  ApplyAiDraftInput,
  ApplyAiDraftResponse,
  ClassSession,
  ListAiChatMessagesResponse,
  SendAiMessageResponse,
  Task,
  TimetableSlot,
} from '@/types';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { addDays, parseISODate, toISODate } from '@/utils';
import type { MockDb } from '../mock-db';
import {
  badRequest,
  conflict,
  created,
  noContent,
  notFound,
  ok,
  route,
} from '../mock-router';
import { nextId, nowISO } from './handler.utils';

export const MAX_AI_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AI_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const APPLY_DRAFT_PATTERN = ENDPOINTS.aiAssistant.applyDraft(':messageId');
const FORTY_FIVE_DAYS_MS = 45 * 24 * 60 * 60 * 1000;

interface ExtractedPayload {
  readonly message: string;
  readonly image: { size?: number; type?: string; name?: string } | null;
}

const extractSendPayload = (body: unknown): ExtractedPayload => {
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const rawMsg = body.get('message');
    const rawImg = body.get('image') as unknown as {
      size?: number;
      type?: string;
      name?: string;
    } | null;
    return {
      message: typeof rawMsg === 'string' ? rawMsg.trim() : '',
      image: rawImg ?? null,
    };
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const rawMsg = record.message;
    const rawImg = record.image as { size?: number; type?: string; name?: string } | null | undefined;
    return {
      message: typeof rawMsg === 'string' ? rawMsg.trim() : '',
      image: rawImg ?? null,
    };
  }

  return { message: '', image: null };
};

const findConflictingSlots = (
  candidate: {
    weekday: number;
    startTime: string;
    endTime: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
  },
  existingSlots: readonly TimetableSlot[],
): TimetableSlot[] => {
  const cFrom = candidate.effectiveFrom;
  const cTo = candidate.effectiveTo || '9999-12-31';

  return existingSlots.filter((slot) => {
    if (slot.weekday !== candidate.weekday) return false;
    if (!(candidate.startTime < slot.endTime && slot.startTime < candidate.endTime)) return false;
    const sFrom = slot.effectiveFrom;
    const sTo = slot.effectiveTo || '9999-12-31';
    return cFrom <= sTo && sFrom <= cTo;
  });
};

const attachConflict = (
  item: AiScheduleDraftItem,
  slots: readonly TimetableSlot[],
  today: string,
): AiScheduleDraftItem => {
  if (item.kind !== 'timetable_slot' || !item.weekday || !item.startTime || !item.endTime) {
    return item;
  }

  const conflicts = findConflictingSlots(
    {
      weekday: item.weekday,
      startTime: item.startTime,
      endTime: item.endTime,
      effectiveFrom: item.effectiveFrom ?? today,
      effectiveTo: item.effectiveTo ?? null,
    },
    slots,
  );

  if (conflicts.length === 0) {
    return { ...item, conflict: null };
  }

  const first = conflicts[0]!;
  return {
    ...item,
    conflict: {
      slotId: first.id,
      subject: first.subject,
      startTime: first.startTime,
      endTime: first.endTime,
    },
  };
};

const isCrossAccountOrInjection = (message: string): boolean => {
  const lower = message.toLowerCase();
  return (
    /(?:ignore\s+(?:all\s+)?(?:previous|prior|above|system)\s+instructions?|system\s+prompt|bypass|bỏ\s+qua\s+(?:hướng\s+dẫn|quy\s+tắc))/i.test(
      lower,
    ) ||
    /(?:lịch|thời\s+khóa\s+biểu|tkb|công\s+việc|ghi\s+chú|dữ\s+liệu|schedule|timetable|tasks?|notes?)\s+(?:của|of|for)\s+(?:user|account|tài\s+khoản|người\s+khác|giáo\s+viên\s+khác|another|other)/i.test(
      lower,
    ) ||
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(lower)
  );
};

const isScheduleDomainRelevant = (message: string, hasImage: boolean): boolean => {
  if (hasImage) return true;
  const lower = message.toLowerCase();
  const domainKeywords = [
    'lịch',
    'tkb',
    'thời khóa biểu',
    'tiết',
    'dạy',
    'học',
    'việc',
    'task',
    'công việc',
    'ghi chú',
    'note',
    'hôm nay',
    'ngày mai',
    'tuần',
    'thứ ',
    'lớp',
    'phòng',
    'schedule',
    'timetable',
    'class',
    'today',
    'tomorrow',
    'week',
    'ielts',
  ];
  return domainKeywords.some((kw) => lower.includes(kw));
};

const isScheduleAddIntent = (message: string, hasImage: boolean): boolean => {
  if (hasImage) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes('thêm') ||
    lower.includes('tạo lịch') ||
    lower.includes('nhập tkb') ||
    lower.includes('add ') ||
    lower.includes('18:00') ||
    lower.includes('19:30')
  );
};

const buildDraftItemsForRequest = (
  message: string,
  hasImage: boolean,
  db: MockDb,
  today: string,
): AiScheduleDraftItem[] => {
  const rawItems: AiScheduleDraftItem[] = [];

  if (hasImage) {
    rawItems.push(
      {
        id: nextId('draft-item'),
        kind: 'timetable_slot',
        category: 'school_teaching',
        titleOrSubject: 'Sinh học nâng cao',
        grade: 'Lớp 10A',
        room: 'Phòng 302',
        weekday: 1,
        startTime: '09:00',
        endTime: '10:30',
        effectiveFrom: today,
        tone: 'blue',
      },
      {
        id: nextId('draft-item'),
        kind: 'timetable_slot',
        category: 'extra_teaching',
        titleOrSubject: 'Toán 9A',
        grade: 'Lớp 9A',
        room: 'Phòng 201',
        weekday: 2,
        startTime: '18:00',
        endTime: '19:30',
        effectiveFrom: today,
        tone: 'mint',
      },
    );
  } else {
    const lower = message.toLowerCase();
    const isSelfStudy = lower.includes('ielts') || lower.includes('học thêm') || lower.includes('tự học');
    const isExtra = lower.includes('dạy thêm') || lower.includes('phụ đạo') || lower.includes('bồi dưỡng');
    const category = isSelfStudy ? 'self_study' : isExtra ? 'extra_teaching' : 'school_teaching';

    if (lower.includes('thứ 3') && lower.includes('thứ 5')) {
      rawItems.push(
        {
          id: nextId('draft-item'),
          kind: 'timetable_slot',
          category,
          titleOrSubject: 'Toán 9A',
          grade: '9A',
          room: 'Phòng học thêm',
          weekday: 2,
          startTime: '18:00',
          endTime: '19:30',
          effectiveFrom: today,
          tone: 'mint',
        },
        {
          id: nextId('draft-item'),
          kind: 'timetable_slot',
          category,
          titleOrSubject: 'Toán 9A',
          grade: '9A',
          room: 'Phòng học thêm',
          weekday: 4,
          startTime: '18:00',
          endTime: '19:30',
          effectiveFrom: today,
          tone: 'mint',
        },
      );
    } else {
      rawItems.push({
        id: nextId('draft-item'),
        kind: 'timetable_slot',
        category,
        titleOrSubject: message.slice(0, 60) || 'Toán 9A',
        grade: '9A',
        room: 'Phòng 101',
        weekday: 2,
        startTime: '18:00',
        endTime: '19:30',
        effectiveFrom: today,
        tone: isSelfStudy ? 'lavender' : isExtra ? 'mint' : 'blue',
      });
    }
  }

  return rawItems.map((item) => attachConflict(item, db.timetableSlots, today));
};

const buildQueryReply = (db: MockDb): string => {
  const slotSummary = db.timetableSlots
    .slice(0, 3)
    .map((s) => `${s.subject} (${s.startTime}–${s.endTime})`)
    .join(', ');
  const pendingTasks = db.tasks.filter((t) => !t.completed);
  const taskSummary = pendingTasks
    .slice(0, 3)
    .map((t) => t.title)
    .join(', ');

  return `Theo lịch của bạn: Có ${db.timetableSlots.length} tiết trong thời khóa biểu (${slotSummary || 'chưa có tiết nào'}) và ${pendingTasks.length} công việc cần hoàn thành (${taskSummary || 'không có việc tồn đọng'}).`;
};

export const aiAssistantRoutes = [
  route('GET', ENDPOINTS.aiAssistant.messages, (request, db) => {
    const rawLimit = request.query.limit ? Number(request.query.limit) : undefined;
    const allMessages = db.aiMessages ?? [];
    const items =
      rawLimit && Number.isFinite(rawLimit) && rawLimit > 0
        ? allMessages.slice(-rawLimit)
        : allMessages;

    const response: ListAiChatMessagesResponse = { items };
    return ok(response);
  }),

  route('POST', ENDPOINTS.aiAssistant.messages, (request, db) => {
    const { message, image } = extractSendPayload(request.body);

    if (!message && !image) {
      return badRequest('Message or image is required', 'validation');
    }

    if (image) {
      if (typeof image.size === 'number' && image.size > MAX_AI_IMAGE_BYTES) {
        return badRequest('Image exceeds 5MB limit', 'file_too_large');
      }
      if (
        image.type &&
        !(ALLOWED_AI_IMAGE_TYPES as readonly string[]).includes(image.type)
      ) {
        return badRequest('Unsupported image type (only JPEG, PNG, WebP allowed)', 'unsupported_file_type');
      }
    }

    if (!db.aiMessages) {
      db.aiMessages = [];
    }

    const now = new Date();
    const today = toISODate(now);

    const userMessage: AiChatMessage = {
      id: nextId('ai-user-msg'),
      accountId: db.user.id,
      role: 'user',
      content: message || 'Đính kèm ảnh Thời khóa biểu',
      imageUrl: image ? `https://storage.cuteteachy.vn/ai-chat/tkb-${now.getTime()}.png` : null,
      imageExpiresAt: image ? new Date(now.getTime() + FORTY_FIVE_DAYS_MS).toISOString() : null,
      draft: null,
      createdAt: now.toISOString(),
    };

    db.aiMessages.push(userMessage);

    let assistantMessage: AiChatMessage;

    if (isCrossAccountOrInjection(message)) {
      assistantMessage = {
        id: nextId('ai-assistant-msg'),
        accountId: db.user.id,
        role: 'assistant',
        content:
          'Vì lý do bảo mật và phân quyền, tôi chỉ được phép truy cập dữ liệu thời khóa biểu, công việc và ghi chú của riêng tài khoản hiện tại. Tôi không có quyền xem dữ liệu của tài khoản hoặc giáo viên khác.',
        imageUrl: null,
        imageExpiresAt: null,
        draft: null,
        createdAt: new Date(now.getTime() + 100).toISOString(),
      };
    } else if (!isScheduleDomainRelevant(message, Boolean(image))) {
      assistantMessage = {
        id: nextId('ai-assistant-msg'),
        accountId: db.user.id,
        role: 'assistant',
        content:
          'Xin lỗi, tôi là Trợ lý AI chuyên biệt về quản lý lịch dạy, thời khóa biểu, công việc và ghi chú trên CuteTeachy. Thầy/cô vui lòng hỏi hoặc gửi ảnh liên quan đến lịch trình giảng dạy và công việc nhé.',
        imageUrl: null,
        imageExpiresAt: null,
        draft: null,
        createdAt: new Date(now.getTime() + 100).toISOString(),
      };
    } else if (isScheduleAddIntent(message, Boolean(image))) {
      const items = buildDraftItemsForRequest(message, Boolean(image), db, today);
      const conflictCount = items.filter((item) => Boolean(item.conflict)).length;
      const draft: AiScheduleDraft = {
        status: 'pending',
        appliedAt: null,
        conflictStrategy: null,
        summary: null,
        items,
      };

      assistantMessage = {
        id: nextId('ai-assistant-msg'),
        accountId: db.user.id,
        role: 'assistant',
        content:
          conflictCount > 0
            ? `Tôi đã bóc tách được ${items.length} mục lịch (có ${conflictCount} mục trùng giờ với lịch hiện có). Bạn vui lòng kiểm tra bản nháp bên dưới và chọn cách xử lý trước khi xác nhận.`
            : `Tôi đã chuẩn bị bản nháp gồm ${items.length} mục lịch. Bạn có thể chỉnh sửa nhanh và bấm Xác nhận thêm lịch để lưu vào tài khoản.`,
        imageUrl: null,
        imageExpiresAt: null,
        draft,
        createdAt: new Date(now.getTime() + 100).toISOString(),
      };
    } else {
      assistantMessage = {
        id: nextId('ai-assistant-msg'),
        accountId: db.user.id,
        role: 'assistant',
        content: buildQueryReply(db),
        imageUrl: null,
        imageExpiresAt: null,
        draft: null,
        createdAt: new Date(now.getTime() + 100).toISOString(),
      };
    }

    db.aiMessages.push(assistantMessage);

    const response: SendAiMessageResponse = {
      userMessage,
      assistantMessage,
    };
    return created(response);
  }),

  route('POST', APPLY_DRAFT_PATTERN, (request, db) => {
    const { messageId } = request.params;
    if (!messageId) {
      return badRequest('Missing messageId', 'validation');
    }

    const body = (request.body ?? {}) as Partial<ApplyAiDraftInput>;
    const conflictStrategy = body.conflictStrategy as AiConflictStrategy | undefined;
    if (
      conflictStrategy !== 'replace_conflicts' &&
      conflictStrategy !== 'skip_conflicts'
    ) {
      return badRequest('conflictStrategy must be replace_conflicts or skip_conflicts', 'validation');
    }

    const messages = db.aiMessages ?? [];
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1 || !messages[msgIndex]?.draft) {
      return notFound('ai_draft_not_found', 'AI schedule draft not found');
    }

    const targetMessage = messages[msgIndex]!;
    const currentDraft = targetMessage.draft!;

    if (currentDraft.status === 'applied') {
      return conflict('ai_draft_already_applied', 'AI schedule draft has already been applied');
    }

    const itemsToApply = Array.isArray(body.items) ? body.items : currentDraft.items;
    const today = toISODate(new Date());
    const yesterday = toISODate(addDays(parseISODate(today), -1));
    const timestamp = nowISO();

    let createdCount = 0;
    let replacedCount = 0;
    let skippedCount = 0;

    for (const item of itemsToApply) {
      if (item.kind === 'timetable_slot') {
        const weekday = item.weekday ?? 1;
        const startTime = item.startTime ?? '07:00';
        const endTime = item.endTime ?? '07:45';
        const effectiveFrom = item.effectiveFrom ?? today;
        const effectiveTo = item.effectiveTo ?? null;

        const conflicting = findConflictingSlots(
          { weekday, startTime, endTime, effectiveFrom, effectiveTo },
          db.timetableSlots,
        );

        if (conflicting.length > 0) {
          if (conflictStrategy === 'skip_conflicts') {
            skippedCount += 1;
            continue;
          }

          // replace_conflicts: end or soft-delete conflicting slots
          for (const cSlot of conflicting) {
            const idx = db.timetableSlots.findIndex((s) => s.id === cSlot.id);
            if (idx === -1) continue;

            if (cSlot.effectiveFrom < today) {
              db.timetableSlots[idx] = {
                ...cSlot,
                effectiveTo: yesterday,
                updatedAt: timestamp,
              };
            } else {
              db.timetableSlots.splice(idx, 1);
              if (!db.tombstones) {
                db.tombstones = {
                  tags: [],
                  tasks: [],
                  notes: [],
                  timetableSlots: [],
                  classSessions: [],
                };
              }
              if (!db.tombstones.timetableSlots) {
                db.tombstones.timetableSlots = [];
              }
              db.tombstones.timetableSlots.push({ id: cSlot.id, deletedAt: timestamp });
            }
          }

          const newSlot: TimetableSlot = {
            id: nextId('slot'),
            weekday,
            startTime,
            endTime,
            subject: item.titleOrSubject.trim(),
            grade: item.grade?.trim() || undefined,
            room: item.room?.trim() || null,
            tone: item.tone ?? 'blue',
            category: item.category ?? 'school_teaching',
            effectiveFrom,
            effectiveTo,
            updatedAt: timestamp,
          };
          db.timetableSlots.push(newSlot);
          replacedCount += 1;
        } else {
          const newSlot: TimetableSlot = {
            id: nextId('slot'),
            weekday,
            startTime,
            endTime,
            subject: item.titleOrSubject.trim(),
            grade: item.grade?.trim() || undefined,
            room: item.room?.trim() || null,
            tone: item.tone ?? 'blue',
            category: item.category ?? 'school_teaching',
            effectiveFrom,
            effectiveTo,
            updatedAt: timestamp,
          };
          db.timetableSlots.push(newSlot);
          createdCount += 1;
        }
      } else if (item.kind === 'class_session') {
        const newSession: ClassSession = {
          id: nextId('adhoc'),
          timetableSlotId: null,
          subject: item.titleOrSubject.trim(),
          grade: item.grade?.trim() || undefined,
          room: item.room?.trim() || null,
          date: item.date ?? today,
          startTime: item.startTime ?? '18:00',
          endTime: item.endTime ?? '19:30',
          tone: item.tone ?? 'mint',
          category: item.category ?? 'school_teaching',
          topic: item.notes?.trim() || undefined,
          prepItems: [],
          cancelled: false,
          updatedAt: timestamp,
        };
        db.adhocSessions.push(newSession);
        createdCount += 1;
      } else if (item.kind === 'task') {
        const newTask: Task = {
          id: nextId('task'),
          title: item.titleOrSubject.trim(),
          date: item.date ?? today,
          ...(item.startTime ? { time: item.startTime } : {}),
          category: item.category === 'self_study' ? 'personal' : 'school',
          priority: 'normal',
          completed: false,
          tagIds: [],
          ...(item.notes ? { notes: item.notes } : {}),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        db.tasks.push(newTask);
        createdCount += 1;
      }
    }

    const summary: AiScheduleDraftSummary = {
      createdCount,
      replacedCount,
      skippedCount,
    };

    const updatedMessage: AiChatMessage = {
      ...targetMessage,
      draft: {
        ...currentDraft,
        status: 'applied',
        appliedAt: timestamp,
        conflictStrategy,
        summary,
        items: itemsToApply,
      },
    };

    messages[msgIndex] = updatedMessage;

    const response: ApplyAiDraftResponse = {
      message: updatedMessage,
      summary,
    };
    return ok(response);
  }),

  route('DELETE', ENDPOINTS.aiAssistant.messages, (_request, db) => {
    db.aiMessages = [];
    return noContent();
  }),
];
