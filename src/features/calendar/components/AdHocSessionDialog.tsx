'use client';

import React, { useId, useState } from 'react';
import type { ISODate, PrepItem, TimeOfDay, Tone } from '@/types';
import { useTranslation } from '@/lib/i18n';
import {
  Button,
  Checkbox,
  Dialog,
  Icon,
  IconButton,
  TextField,
} from '@/components/ui';
import { DateField, TimeField } from '@/components/pickers';
import { TonePicker } from '@/features/tags';
import { generateClientUuid } from '@/lib/sync';
import {
  adhocSessionSchema,
  LIMITS,
  toISODate,
  validate,
  type FieldErrors,
  type AdhocSessionFormValues,
} from '@/utils';
import { useFieldErrorText } from '@/hooks';
import { useCreateAdHocSession } from '../api';
import { ApiError } from '@/lib/api';

export interface AdHocSessionDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly defaultDate?: ISODate;
}

export function AdHocSessionDialog({
  open,
  onClose,
  defaultDate,
}: AdHocSessionDialogProps) {
  if (!open) return null;

  return (
    <AdHocSessionDialogContent
      open={open}
      onClose={onClose}
      defaultDate={defaultDate}
    />
  );
}

function AdHocSessionDialogContent({
  open,
  onClose,
  defaultDate,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly defaultDate?: ISODate;
}) {
  const { t } = useTranslation();
  const formatError = useFieldErrorText();
  const toneLabelId = useId();
  const createMutation = useCreateAdHocSession();

  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [room, setRoom] = useState('');
  const [date, setDate] = useState<ISODate>(() => defaultDate ?? toISODate(new Date()));
  const [startTime, setStartTime] = useState<TimeOfDay>('07:30');
  const [endTime, setEndTime] = useState<TimeOfDay>('09:00');
  const [tone, setTone] = useState<Tone>('mint');
  const [topic, setTopic] = useState('');
  const [prepItems, setPrepItems] = useState<PrepItem[]>([]);
  const [newPrepLabel, setNewPrepLabel] = useState('');
  const [errors, setErrors] = useState<FieldErrors<AdhocSessionFormValues>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const handleTogglePrepItem = (itemId: string, checked: boolean) => {
    setPrepItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, done: checked } : item)),
    );
  };

  const handleDeletePrepItem = (itemId: string) => {
    setPrepItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleAddPrepItem = () => {
    const trimmed = newPrepLabel.trim();
    if (!trimmed) return;
    if (prepItems.length >= 100) return;

    const newItem: PrepItem = {
      id: generateClientUuid(),
      label: trimmed,
      done: false,
    };
    setPrepItems((prev) => [...prev, newItem]);
    setNewPrepLabel('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError(null);

    const validationResult = validate(adhocSessionSchema, {
      subject,
      grade: grade || undefined,
      room: room || undefined,
      date,
      startTime,
      endTime,
      tone,
      topic: topic || undefined,
      prepItems,
    });

    if (!validationResult.success) {
      setErrors(validationResult.errors);
      return;
    }

    setErrors({});
    try {
      await createMutation.mutateAsync({
        id: generateClientUuid(),
        ...validationResult.data,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.messageKey) {
        setApiError(t(err.messageKey));
      } else {
        setApiError(t('errors.generic'));
      }
    }
  };

  const isSubmitting = createMutation.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('classSession.createAdHocTitle')}
      size="md"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
            {t('classSession.create')}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {apiError && (
          <div
            role="alert"
            data-testid="api-error"
            className="flex items-start gap-3 rounded-xl border border-error/40 bg-error-container/20 p-3.5 text-error"
          >
            <Icon name="flag" className="size-5 shrink-0 text-error mt-0.5" />
            <p className="text-body-sm font-semibold">{apiError}</p>
          </div>
        )}
        <TextField
          label={t('classSession.subject')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={LIMITS.titleMax}
          error={formatError(errors.subject, t('classSession.subject'))}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label={t('classSession.grade')}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            maxLength={60}
            error={formatError(errors.grade, t('classSession.grade'))}
          />
          <TextField
            label={t('classSession.room')}
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            maxLength={60}
            error={formatError(errors.room, t('classSession.room'))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DateField
            label={t('classSession.date')}
            value={date}
            onChange={setDate}
            error={formatError(errors.date, t('classSession.date'))}
          />
          <TimeField
            label={t('classSession.startTime')}
            value={startTime}
            onChange={(time) => setStartTime(time ?? '07:30')}
            error={formatError(errors.startTime, t('classSession.startTime'))}
          />
          <TimeField
            label={t('classSession.endTime')}
            value={endTime}
            onChange={(time) => setEndTime(time ?? '09:00')}
            error={formatError(errors.endTime, t('classSession.endTime'))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span
            id={toneLabelId}
            className="text-label-md text-on-surface-variant font-medium uppercase tracking-wider"
          >
            {t('classSession.tone')}
          </span>
          <TonePicker value={tone} onChange={setTone} labelledBy={toneLabelId} />
        </div>

        <TextField
          label={t('classSession.topic')}
          placeholder={t('classSession.topicPlaceholder')}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={200}
          error={formatError(errors.topic, t('classSession.topic'))}
        />

        {/* Prep items */}
        <div className="flex flex-col gap-3">
          <span className="text-title-md font-bold text-on-surface">
            {t('classSession.prepItems')}
          </span>

          {prepItems.length > 0 && (
            <div className="flex flex-col divide-y divide-outline-variant/20 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3">
              {prepItems.map((item) => (
                <div
                  key={item.id}
                  className="flex min-h-touch items-center justify-between gap-3 py-1"
                >
                  <Checkbox
                    checked={item.done}
                    onChange={(checked) => handleTogglePrepItem(item.id, checked)}
                    label={item.label}
                    strikeWhenChecked
                    className="flex-1"
                  />
                  <IconButton
                    icon="delete"
                    aria-label={t('common.actions.delete')}
                    size="sm"
                    onClick={() => handleDeletePrepItem(item.id)}
                    className="text-on-surface-variant hover:text-error"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1">
              <TextField
                label={t('classSession.addPrepItem')}
                hideLabel
                placeholder={t('classSession.prepItemPlaceholder')}
                value={newPrepLabel}
                onChange={(e) => setNewPrepLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPrepItem();
                  }
                }}
                maxLength={LIMITS.titleMax}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon="add"
              onClick={handleAddPrepItem}
              disabled={!newPrepLabel.trim()}
            >
              {t('classSession.addPrepItemAction')}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
