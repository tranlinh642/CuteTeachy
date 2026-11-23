'use client';

import { useState } from 'react';
import {
  SCHEDULE_CATEGORIES,
  type AiConflictStrategy,
  type AiScheduleDraft,
  type AiScheduleDraftItem,
  type ApplyAiDraftInput,
  type ApplyAiDraftResponse,
  type ID,
  type ScheduleCategory,
} from '@/types';
import { useTranslation, type TranslationKey } from '@/lib/i18n';
import { Button, Card, Icon } from '@/components/ui';
import { cn } from '@/utils/cn';
import { useApplyAiDraft, type ApplyAiDraftVariables } from '../api';

const WEEKDAY_OPTIONS = [
  { value: 1, key: 'timetable.weekdays.mon' },
  { value: 2, key: 'timetable.weekdays.tue' },
  { value: 3, key: 'timetable.weekdays.wed' },
  { value: 4, key: 'timetable.weekdays.thu' },
  { value: 5, key: 'timetable.weekdays.fri' },
  { value: 6, key: 'timetable.weekdays.sat' },
  { value: 7, key: 'timetable.weekdays.sun' },
] as const;

export function updateDraftItemField(
  items: readonly AiScheduleDraftItem[],
  itemId: ID,
  patch: Partial<AiScheduleDraftItem>,
): AiScheduleDraftItem[] {
  return items.map((item) => (item.id === itemId ? { ...item, ...patch } : item));
}

export function buildApplyDraftPayload(
  items: readonly AiScheduleDraftItem[],
  selectedIds: ReadonlySet<ID>,
  conflictStrategy: AiConflictStrategy,
): ApplyAiDraftInput {
  return {
    conflictStrategy,
    items: items.filter((item) => selectedIds.has(item.id)),
  };
}

export interface SubmitAiScheduleDraftParams {
  readonly messageId: ID;
  readonly items: readonly AiScheduleDraftItem[];
  readonly selectedIds: ReadonlySet<ID>;
  readonly conflictStrategy: AiConflictStrategy;
  readonly applyDraftMutation: (
    variables: ApplyAiDraftVariables,
  ) => Promise<ApplyAiDraftResponse>;
}

export async function submitAiScheduleDraft({
  messageId,
  items,
  selectedIds,
  conflictStrategy,
  applyDraftMutation,
}: SubmitAiScheduleDraftParams): Promise<ApplyAiDraftResponse> {
  const payload = buildApplyDraftPayload(items, selectedIds, conflictStrategy);
  return applyDraftMutation({
    messageId,
    conflictStrategy: payload.conflictStrategy,
    items: payload.items,
  });
}

export interface AiScheduleDraftCardProps {
  readonly messageId: ID;
  readonly draft: AiScheduleDraft;
  readonly defaultConflictStrategy?: AiConflictStrategy;
  readonly onApplied?: (response: ApplyAiDraftResponse) => void;
}

export function AiScheduleDraftCard({
  messageId,
  draft,
  defaultConflictStrategy = 'replace_conflicts',
  onApplied,
}: AiScheduleDraftCardProps) {
  const { t } = useTranslation();
  const applyDraftMutation = useApplyAiDraft();

  const [editedItems, setEditedItems] = useState<AiScheduleDraftItem[]>(() => [
    ...draft.items,
  ]);
  const [selectedIds, setSelectedIds] = useState<Set<ID>>(
    () => new Set(draft.items.map((item) => item.id)),
  );
  const [conflictStrategy, setConflictStrategy] = useState<AiConflictStrategy>(
    draft.conflictStrategy ?? defaultConflictStrategy,
  );
  const [appliedState, setAppliedState] = useState<AiScheduleDraft | null>(
    draft.status === 'applied' ? draft : null,
  );
  const [applyErrorKey, setApplyErrorKey] = useState<TranslationKey | null>(null);

  const effectiveDraft = appliedState ?? draft;
  const isApplied = effectiveDraft.status === 'applied';
  const isApplying = applyDraftMutation.isPending;

  const toggleSelectItem = (itemId: ID) => {
    if (isApplied) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleFieldChange = (itemId: ID, patch: Partial<AiScheduleDraftItem>) => {
    if (isApplied) return;
    setEditedItems((prev) => updateDraftItemField(prev, itemId, patch));
  };

  const handleConfirmApply = async () => {
    if (isApplied || isApplying || selectedIds.size === 0) return;
    setApplyErrorKey(null);
    try {
      const response = await submitAiScheduleDraft({
        messageId,
        items: editedItems,
        selectedIds,
        conflictStrategy,
        applyDraftMutation: (vars) => applyDraftMutation.mutateAsync(vars),
      });
      if (response.message.draft) {
        setAppliedState(response.message.draft);
      }
      onApplied?.(response);
    } catch (err) {
      const key =
        err && typeof err === 'object' && 'messageKey' in err && typeof err.messageKey === 'string'
          ? (err.messageKey as TranslationKey)
          : ('errors.generic' as TranslationKey);
      setApplyErrorKey(key);
    }
  };

  const activeErrorKey: TranslationKey | null =
    applyErrorKey ??
    (applyDraftMutation.isError
      ? ((applyDraftMutation.error &&
        typeof applyDraftMutation.error === 'object' &&
        'messageKey' in applyDraftMutation.error &&
        typeof applyDraftMutation.error.messageKey === 'string'
          ? applyDraftMutation.error.messageKey
          : 'errors.generic') as TranslationKey)
      : null);

  return (
    <Card
      data-testid={`ai-draft-card-${messageId}`}
      data-status={effectiveDraft.status}
      className="mt-3 flex flex-col gap-4 border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
        <div className="flex items-center gap-2">
          <Icon name="calendar" size={20} className="text-primary" />
          <h3 className="text-title-sm font-bold text-on-surface">
            {t('aiAssistant.draft.title')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-label-sm text-on-surface-variant">
            {t('aiAssistant.draft.selectedCount', {
              selected: selectedIds.size,
              total: editedItems.length,
            })}
          </span>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-label-xs font-bold',
              isApplied
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-primary-container text-on-primary-container',
            )}
          >
            {isApplied
              ? t('aiAssistant.draft.statusApplied')
              : t('aiAssistant.draft.statusPending')}
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-3">
        {editedItems.map((item) => {
          const isSelected = selectedIds.has(item.id);
          const hasConflict = Boolean(item.conflict);

          return (
            <div
              key={item.id}
              data-testid={`draft-item-${item.id}`}
              className={cn(
                'flex flex-col gap-2.5 rounded-xl border p-3 transition-colors',
                hasConflict
                  ? 'border-error/50 bg-error-container/10'
                  : 'border-outline-variant/30 bg-surface-container-low',
                !isSelected && 'opacity-60',
              )}
            >
              {/* Top row: Checkbox + Kind badge + Conflict warning badge */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid={`draft-item-checkbox-${item.id}`}
                    checked={isSelected}
                    disabled={isApplied}
                    onChange={() => toggleSelectItem(item.id)}
                    aria-label={t('aiAssistant.draft.selectItem', {
                      title: item.titleOrSubject,
                    })}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                  <span className="rounded-md bg-surface-container-highest px-2 py-0.5 text-label-xs font-bold text-on-surface">
                    {t(`aiAssistant.draft.kinds.${item.kind}` as TranslationKey)}
                  </span>
                </label>

                {hasConflict && item.conflict && (
                  <div
                    data-testid={`draft-item-conflict-${item.id}`}
                    role="alert"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-error-container px-2.5 py-1 text-label-xs font-bold text-on-error-container"
                  >
                    <Icon name="flag" size={14} />
                    <span>
                      {t('aiAssistant.draft.conflictWarning', {
                        subject: item.conflict.subject,
                        startTime: item.conflict.startTime,
                        endTime: item.conflict.endTime,
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick edit fields grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {/* Title or Subject */}
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-label-xs font-medium text-on-surface-variant">
                    {t('aiAssistant.draft.fields.titleOrSubject')}
                  </span>
                  <input
                    type="text"
                    data-testid={`draft-item-title-${item.id}`}
                    value={item.titleOrSubject}
                    disabled={isApplied}
                    onChange={(e) =>
                      handleFieldChange(item.id, { titleOrSubject: e.target.value })
                    }
                    className="rounded-lg border border-outline-variant/50 bg-surface px-2.5 py-1.5 text-body-sm text-on-surface"
                  />
                </label>

                {/* Schedule Category */}
                <label className="flex flex-col gap-1">
                  <span className="text-label-xs font-medium text-on-surface-variant">
                    {t('aiAssistant.draft.fields.category')}
                  </span>
                  <select
                    data-testid={`draft-item-category-${item.id}`}
                    value={item.category}
                    disabled={isApplied}
                    onChange={(e) =>
                      handleFieldChange(item.id, {
                        category: e.target.value as ScheduleCategory,
                      })
                    }
                    className="rounded-lg border border-outline-variant/50 bg-surface px-2.5 py-1.5 text-body-sm text-on-surface"
                  >
                    {SCHEDULE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {t(`aiAssistant.draft.categories.${cat}` as TranslationKey)}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Weekday (for timetable_slot) or Date (for class_session / task) */}
                {item.kind === 'timetable_slot' ? (
                  <label className="flex flex-col gap-1">
                    <span className="text-label-xs font-medium text-on-surface-variant">
                      {t('aiAssistant.draft.fields.weekday')}
                    </span>
                    <select
                      data-testid={`draft-item-weekday-${item.id}`}
                      value={item.weekday ?? 1}
                      disabled={isApplied}
                      onChange={(e) =>
                        handleFieldChange(item.id, { weekday: Number(e.target.value) })
                      }
                      className="rounded-lg border border-outline-variant/50 bg-surface px-2.5 py-1.5 text-body-sm text-on-surface"
                    >
                      {WEEKDAY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {t(opt.key as TranslationKey)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label className="flex flex-col gap-1">
                    <span className="text-label-xs font-medium text-on-surface-variant">
                      {t('aiAssistant.draft.fields.date')}
                    </span>
                    <input
                      type="date"
                      data-testid={`draft-item-date-${item.id}`}
                      value={item.date ?? ''}
                      disabled={isApplied}
                      onChange={(e) => handleFieldChange(item.id, { date: e.target.value })}
                      className="rounded-lg border border-outline-variant/50 bg-surface px-2.5 py-1.5 text-body-sm text-on-surface"
                    />
                  </label>
                )}

                {/* Start Time */}
                <label className="flex flex-col gap-1">
                  <span className="text-label-xs font-medium text-on-surface-variant">
                    {t('aiAssistant.draft.fields.startTime')}
                  </span>
                  <input
                    type="time"
                    data-testid={`draft-item-start-time-${item.id}`}
                    value={item.startTime ?? ''}
                    disabled={isApplied}
                    onChange={(e) =>
                      handleFieldChange(item.id, { startTime: e.target.value })
                    }
                    className="rounded-lg border border-outline-variant/50 bg-surface px-2.5 py-1.5 text-body-sm text-on-surface"
                  />
                </label>

                {/* End Time (for timetable_slot and class_session) */}
                {item.kind !== 'task' && (
                  <label className="flex flex-col gap-1">
                    <span className="text-label-xs font-medium text-on-surface-variant">
                      {t('aiAssistant.draft.fields.endTime')}
                    </span>
                    <input
                      type="time"
                      data-testid={`draft-item-end-time-${item.id}`}
                      value={item.endTime ?? ''}
                      disabled={isApplied}
                      onChange={(e) =>
                        handleFieldChange(item.id, { endTime: e.target.value })
                      }
                      className="rounded-lg border border-outline-variant/50 bg-surface px-2.5 py-1.5 text-body-sm text-on-surface"
                    />
                  </label>
                )}

                {/* Grade & Room (for timetable_slot and class_session) */}
                {item.kind !== 'task' && (
                  <>
                    <label className="flex flex-col gap-1">
                      <span className="text-label-xs font-medium text-on-surface-variant">
                        {t('aiAssistant.draft.fields.grade')}
                      </span>
                      <input
                        type="text"
                        data-testid={`draft-item-grade-${item.id}`}
                        value={item.grade ?? ''}
                        disabled={isApplied}
                        onChange={(e) =>
                          handleFieldChange(item.id, { grade: e.target.value })
                        }
                        className="rounded-lg border border-outline-variant/50 bg-surface px-2.5 py-1.5 text-body-sm text-on-surface"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-label-xs font-medium text-on-surface-variant">
                        {t('aiAssistant.draft.fields.room')}
                      </span>
                      <input
                        type="text"
                        data-testid={`draft-item-room-${item.id}`}
                        value={item.room ?? ''}
                        disabled={isApplied}
                        onChange={(e) =>
                          handleFieldChange(item.id, { room: e.target.value })
                        }
                        className="rounded-lg border border-outline-variant/50 bg-surface px-2.5 py-1.5 text-body-sm text-on-surface"
                      />
                    </label>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Conflict strategy selector */}
      <div
        data-testid="draft-conflict-strategy"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-surface-container p-3"
      >
        <span className="text-label-md font-semibold text-on-surface">
          {t('aiAssistant.draft.conflictStrategyLabel')}:
        </span>
        <div className="flex flex-wrap items-center gap-2" role="radiogroup">
          <button
            type="button"
            role="radio"
            aria-checked={conflictStrategy === 'replace_conflicts'}
            disabled={isApplied}
            data-testid="conflict-strategy-replace_conflicts"
            onClick={() => setConflictStrategy('replace_conflicts')}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-label-sm font-medium transition-all cursor-pointer',
              conflictStrategy === 'replace_conflicts'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface text-on-surface-variant hover:bg-surface-container-high',
            )}
          >
            {t('aiAssistant.draft.replaceConflicts')}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={conflictStrategy === 'skip_conflicts'}
            disabled={isApplied}
            data-testid="conflict-strategy-skip_conflicts"
            onClick={() => setConflictStrategy('skip_conflicts')}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-label-sm font-medium transition-all cursor-pointer',
              conflictStrategy === 'skip_conflicts'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface text-on-surface-variant hover:bg-surface-container-high',
            )}
          >
            {t('aiAssistant.draft.skipConflicts')}
          </button>
        </div>
      </div>

      {/* Apply error alert */}
      {activeErrorKey && (
        <div
          data-testid={`draft-apply-error-${messageId}`}
          role="alert"
          className="rounded-xl bg-error-container px-3.5 py-2.5 text-body-sm font-medium text-on-error-container"
        >
          {t(activeErrorKey)}
        </div>
      )}

      {/* Applied summary */}
      {isApplied && effectiveDraft.summary && (
        <div
          data-testid="draft-applied-summary"
          className="flex items-center gap-2 rounded-xl bg-secondary-container/60 px-3.5 py-2.5 text-body-sm font-medium text-on-secondary-container"
        >
          <Icon name="check" size={18} />
          <span>
            {t('aiAssistant.draft.summary', {
              created: effectiveDraft.summary.createdCount,
              replaced: effectiveDraft.summary.replacedCount,
              skipped: effectiveDraft.summary.skippedCount,
            })}
          </span>
        </div>
      )}

      {/* Footer / Action Button */}
      <div className="flex items-center justify-end pt-1">
        <Button
          type="button"
          variant="primary"
          size="md"
          icon="check"
          data-testid="apply-draft-button"
          disabled={isApplied || isApplying || selectedIds.size === 0}
          onClick={handleConfirmApply}
        >
          {isApplied
            ? t('aiAssistant.draft.appliedButton')
            : isApplying
              ? t('aiAssistant.draft.applying')
              : t('aiAssistant.draft.confirmApply')}
        </Button>
      </div>
    </Card>
  );
}
