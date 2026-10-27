'use client';

import React, { useEffect, useId, useState } from 'react';
import type { ClassSession, ID, PrepItem, TimeOfDay, Tone } from '@/types';
import { useTranslation } from '@/lib/i18n';
import {
  Button,
  Checkbox,
  ConfirmDialog,
  Dialog,
  Icon,
  IconButton,
  TextField,
  toneClasses,
} from '@/components/ui';
import { DateField, TimeField } from '@/components/pickers';
import { TonePicker } from '@/features/tags';
import { generateClientUuid } from '@/lib/sync';
import { formatShortDate, formatTimeRange, LIMITS, isValidISODate, isValidTime } from '@/utils';
import { cn } from '@/utils/cn';
import { useDeleteClassSession, useUpdateClassSession } from '../api';

export interface SessionDetailDialogProps {
  readonly session: ClassSession | null;
  readonly open: boolean;
  readonly onClose: () => void;
}

export function SessionDetailDialog({
  session,
  open,
  onClose,
}: SessionDetailDialogProps) {
  if (!session || !open) return null;

  return (
    <SessionDetailDialogContent
      key={session.id}
      session={session}
      open={open}
      onClose={onClose}
    />
  );
}

function SessionDetailDialogContent({
  session,
  open,
  onClose,
}: {
  readonly session: ClassSession;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const { t, localeTag } = useTranslation();
  const isGenerated = session.timetableSlotId !== null;
  const toneLabelId = useId();

  const updateMutation = useUpdateClassSession();
  const deleteMutation = useDeleteClassSession();

  // Shared state
  const [topic, setTopic] = useState(session.topic ?? '');
  const [prepItems, setPrepItems] = useState<PrepItem[]>(() => [...(session.prepItems ?? [])]);
  const [cancelled, setCancelled] = useState(session.cancelled ?? false);
  const [newPrepLabel, setNewPrepLabel] = useState('');

  // Adhoc-specific state
  const [subject, setSubject] = useState(session.subject ?? '');
  const [grade, setGrade] = useState(session.grade ?? '');
  const [room, setRoom] = useState(session.room ?? '');
  const [date, setDate] = useState(session.date);
  const [startTime, setStartTime] = useState<TimeOfDay>(session.startTime);
  const [endTime, setEndTime] = useState<TimeOfDay>(session.endTime);
  const [tone, setTone] = useState<Tone>(session.tone ?? 'mint');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    setTopic(session.topic ?? '');
    setPrepItems([...(session.prepItems ?? [])]);
    setCancelled(session.cancelled ?? false);
    setSubject(session.subject ?? '');
    setGrade(session.grade ?? '');
    setRoom(session.room ?? '');
    setDate(session.date);
    setStartTime(session.startTime);
    setEndTime(session.endTime);
    setTone(session.tone ?? 'mint');
    setErrors({});
  }, [session]);

  const handleTogglePrepItem = (itemId: ID, checked: boolean) => {
    setPrepItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, done: checked } : item)),
    );
  };

  const handleDeletePrepItem = (itemId: ID) => {
    setPrepItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleAddPrepItem = () => {
    const trimmed = newPrepLabel.trim();
    if (!trimmed) return;
    if (prepItems.length >= 100) {
      setErrors((prev) => ({ ...prev, prepItems: t('classSession.prepItemsMax') }));
      return;
    }
    const newItem: PrepItem = {
      id: generateClientUuid(),
      label: trimmed,
      done: false,
    };
    setPrepItems((prev) => [...prev, newItem]);
    setNewPrepLabel('');
  };

  const handleToggleCancelled = () => {
    setCancelled((prev) => !prev);
  };

  const handleSave = async () => {
    if (isGenerated) {
      await updateMutation.mutateAsync({
        id: session.id,
        input: {
          topic: topic.trim() || undefined,
          prepItems,
          cancelled,
        },
      });
      onClose();
      return;
    }

    // Validate adhoc fields
    const newErrors: Record<string, string> = {};
    if (!subject.trim()) {
      newErrors.subject = t('validation.required', { field: t('classSession.subject') });
    }
    if (!date || !isValidISODate(date)) {
      newErrors.date = t('validation.invalidDate');
    }
    if (!startTime || !isValidTime(startTime)) {
      newErrors.startTime = t('validation.invalidTime');
    }
    if (!endTime || !isValidTime(endTime)) {
      newErrors.endTime = t('validation.invalidTime');
    } else if (startTime && endTime && startTime >= endTime) {
      newErrors.endTime = t('classSession.timeInvalid');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await updateMutation.mutateAsync({
      id: session.id,
      input: {
        subject: subject.trim(),
        grade: grade.trim() || undefined,
        room: room.trim() || null,
        date,
        startTime,
        endTime,
        tone,
        topic: topic.trim() || undefined,
        prepItems,
        cancelled,
      },
    });
    onClose();
  };

  const handleConfirmDelete = async () => {
    await deleteMutation.mutateAsync(session.id);
    setConfirmDeleteOpen(false);
    onClose();
  };

  const isSubmitting = updateMutation.isPending || deleteMutation.isPending;
  const toneStyle = toneClasses[tone];

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={isGenerated ? t('classSession.detailTitle') : t('classSession.editAdHocTitle')}
        size="md"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <div>
              {!isGenerated && (
                <Button
                  variant="danger"
                  icon="delete"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={isSubmitting}
                >
                  {t('classSession.deleteAdHoc')}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                {t('common.actions.cancel')}
              </Button>
              <Button variant="primary" onClick={handleSave} loading={isSubmitting}>
                {t('classSession.save')}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          {/* Badge & Trạng thái huỷ */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/30 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {isGenerated ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-label-md font-bold text-on-secondary-container">
                  <Icon name="calendar" size={16} />
                  {t('classSession.slotGeneratedBadge')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-3 py-1 text-label-md font-semibold text-on-surface-variant">
                  <Icon name="add" size={16} />
                  {t('classSession.adHocBadge')}
                </span>
              )}

              {cancelled && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-error-container/90 px-3 py-1 text-label-md font-bold text-on-error-container">
                  <Icon name="close" size={16} />
                  {t('classSession.cancelledBadge')}
                </span>
              )}
            </div>

            {/* Nút Huỷ / Khôi phục buổi dạy */}
            <Button
              variant={cancelled ? 'secondary' : 'ghost'}
              size="sm"
              icon={cancelled ? 'check' : 'close'}
              className={cn(!cancelled && 'text-error hover:bg-error-container/20')}
              onClick={handleToggleCancelled}
            >
              {cancelled ? t('classSession.restoreSession') : t('classSession.cancelSession')}
            </Button>
          </div>

          {/* Chi tiết buổi sinh từ slot (read-only headers) */}
          {isGenerated ? (
            <div className={cn('flex flex-col gap-3 rounded-2xl p-4', toneStyle.bg)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className={cn('text-title-lg font-bold', toneStyle.fg, cancelled && 'line-through')}>
                  {session.grade ? `${session.subject} – ${session.grade}` : session.subject}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-md text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5 font-medium text-on-surface">
                  <Icon name="calendar" size={16} />
                  {formatShortDate(new Date(session.date), localeTag)}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-on-surface">
                  <Icon name="clock" size={16} />
                  {formatTimeRange(session.startTime, session.endTime, localeTag)}
                </span>
                {session.room && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="school" size={16} />
                    {session.room}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Form chỉnh sửa buổi lẻ (mọi trường) */
            <div className="flex flex-col gap-4">
              <TextField
                label={t('classSession.subject')}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={LIMITS.titleMax}
                error={errors.subject}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  label={t('classSession.grade')}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  maxLength={60}
                />
                <TextField
                  label={t('classSession.room')}
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  maxLength={60}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DateField
                  label={t('classSession.date')}
                  value={date}
                  onChange={setDate}
                  error={errors.date}
                />
                <TimeField
                  label={t('classSession.startTime')}
                  value={startTime}
                  onChange={(time) => setStartTime(time ?? '07:30')}
                  error={errors.startTime}
                />
                <TimeField
                  label={t('classSession.endTime')}
                  value={endTime}
                  onChange={(time) => setEndTime(time ?? '09:00')}
                  error={errors.endTime}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span id={toneLabelId} className="text-label-md text-on-surface-variant font-medium uppercase tracking-wider">
                  {t('classSession.tone')}
                </span>
                <TonePicker value={tone} onChange={setTone} labelledBy={toneLabelId} />
              </div>
            </div>
          )}

          {/* Sửa chủ đề bài dạy */}
          <div className="flex flex-col gap-2">
            <TextField
              label={t('classSession.topic')}
              placeholder={t('classSession.topicPlaceholder')}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Danh sách việc cần chuẩn bị prepItems */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-title-md font-bold text-on-surface">
                {t('classSession.prepItems')}
                {prepItems.length > 0 && (
                  <span className="ml-2 text-label-md font-normal text-on-surface-variant">
                    ({prepItems.filter((i) => i.done).length}/{prepItems.length})
                  </span>
                )}
              </span>
            </div>

            {/* Danh sách hiện có */}
            {prepItems.length === 0 ? (
              <p className="text-body-md text-on-surface-variant italic py-2">
                {t('classSession.noPrepItems')}
              </p>
            ) : (
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
                      aria-label="Xoá việc này"
                      size="sm"
                      onClick={() => handleDeletePrepItem(item.id)}
                      className="text-on-surface-variant hover:text-error"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Input thêm việc mới */}
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
                  error={errors.prepItems}
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
        </div>
      </Dialog>

      {/* Confirmation dialog for deleting ad-hoc session */}
      {!isGenerated && (
        <ConfirmDialog
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={handleConfirmDelete}
          title={t('classSession.deleteAdHocConfirmTitle')}
          message={t('classSession.deleteAdHocConfirmDescription')}
          confirmLabel={t('common.actions.delete')}
          destructive
          loading={deleteMutation.isPending}
        />
      )}
    </>
  );
}
