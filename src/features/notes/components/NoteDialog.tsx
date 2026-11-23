"use client";

import { useEffect, useState } from "react";
import { useCreateNote, useUpdateNote } from "../api";
import {
  createId,
  noteSchema,
  toISODate,
  validate,
  type FieldErrors,
  type NoteFormValues,
} from "@/utils";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import type { ChecklistItem, ID, ISODate, Note, TimeOfDay } from "@/types";
import { DateField, TimeField } from "@/components/pickers";
import {
  Button,
  Checkbox,
  Dialog,
  IconButton,
  TextArea,
  TextField,
} from "@/components/ui";
import { TagPicker } from "@/features/tags";
import { useFieldErrorText } from "@/hooks";

export interface NoteDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly note?: Note;
}

export function NoteDialog({ open, onClose, note }: NoteDialogProps) {
  const { t } = useTranslation();
  const formatError = useFieldErrorText();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() =>
    note?.checklist ? [...note.checklist] : [],
  );
  const [newChecklistText, setNewChecklistText] = useState("");
  const [tagIds, setTagIds] = useState<ID[]>(() =>
    note?.tagIds ? [...note.tagIds] : [],
  );
  const [dueDate, setDueDate] = useState<ISODate | undefined>(note?.dueDate);
  const [remindTime, setRemindTime] = useState<TimeOfDay | undefined>(
    note?.remindTime ?? undefined,
  );
  const [completed, setCompleted] = useState(Boolean(note?.completed));
  const [errors, setErrors] = useState<FieldErrors<NoteFormValues>>({});
  const [submitErrorKey, setSubmitErrorKey] = useState<TranslationKey | null>(
    null,
  );

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content ?? "");
      setChecklist([...note.checklist]);
      setTagIds([...note.tagIds]);
      setDueDate(note.dueDate);
      setRemindTime(note.remindTime ?? undefined);
      setCompleted(Boolean(note.completed));
    } else {
      setTitle("");
      setContent("");
      setChecklist([]);
      setTagIds([]);
      setDueDate(undefined);
      setRemindTime(undefined);
      setCompleted(false);
    }
    setNewChecklistText("");
    setErrors({});
    setSubmitErrorKey(null);
  }, [note, open]);

  const addChecklistItem = () => {
    const trimmed = newChecklistText.trim();
    if (!trimmed) return;
    setChecklist((items) => [
      ...items,
      { id: createId(), text: trimmed, done: false },
    ]);
    setNewChecklistText("");
  };

  const removeChecklistItem = (id: ID) => {
    setChecklist((items) => items.filter((i) => i.id !== id));
  };

  const toggleChecklistItem = (id: ID) => {
    setChecklist((items) =>
      items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const result = validate(noteSchema, {
      title,
      content: content || undefined,
      checklist,
      tagIds,
      dueDate,
      remindTime: dueDate ? remindTime || undefined : undefined,
      completed: checklist.length === 0 ? completed : undefined,
    });

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitErrorKey(null);
    try {
      if (note) {
        const effectiveRemindTime = result.data.dueDate
          ? (result.data.remindTime ?? (note.remindTime ? null : undefined))
          : note.remindTime
            ? null
            : undefined;
        await updateNote.mutateAsync({
          id: note.id,
          input: {
            ...result.data,
            ...(effectiveRemindTime !== undefined
              ? { remindTime: effectiveRemindTime }
              : {}),
          },
        });
      } else {
        await createNote.mutateAsync(result.data);
      }
      onClose();
    } catch (err) {
      const key =
        err &&
        typeof err === "object" &&
        "messageKey" in err &&
        typeof err.messageKey === "string"
          ? (err.messageKey as TranslationKey)
          : ("errors.generic" as TranslationKey);
      setSubmitErrorKey(key);
    }
  };

  const isSubmitting = createNote.isPending || updateNote.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={note ? t("notes.editor.editTitle") : t("notes.editor.createTitle")}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t("common.actions.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            {t("notes.editor.save")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField
          label={t("notes.editor.titleLabel")}
          placeholder={t("notes.editor.titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={formatError(errors.title, t("notes.editor.titleLabel"))}
          required
          data-autofocus
        />

        <TextArea
          label={t("notes.editor.contentLabel")}
          placeholder={t("notes.editor.contentPlaceholder")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          error={formatError(errors.content, t("notes.editor.contentLabel"))}
        />

        {/* Mục kiểm tra Checklist */}
        <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-4 border border-outline-variant/40">
          <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
            {t("notes.editor.checklistLabel")}
          </label>

          <div className="flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addChecklistItem();
                }
              }}
              placeholder={t("notes.editor.addChecklistItem")}
              className="min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-sm text-on-surface focus:outline-primary"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon="add"
              className="shrink-0 whitespace-nowrap"
              onClick={addChecklistItem}
            >
              {t("notes.editor.addChecklistItem")}
            </Button>
          </div>

          {checklist.length > 0 ? (
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-outline-variant/30">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={item.done}
                    onChange={() => toggleChecklistItem(item.id)}
                    label={item.text}
                    hideLabel
                  />
                  <span
                    className={`flex-1 text-body-sm text-on-surface ${item.done ? "line-through opacity-60" : ""}`}
                  >
                    {item.text}
                  </span>
                  <IconButton
                    icon="delete"
                    size="sm"
                    aria-label={t("common.actions.delete")}
                    onClick={() => removeChecklistItem(item.id)}
                    className="hover:text-error"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 pt-2 border-t border-outline-variant/30">
              <Checkbox
                checked={completed}
                onChange={setCompleted}
                label={t("notes.editor.completedLabel")}
                shape="circle"
              />
            </div>
          )}
        </div>

        <TagPicker
          label={t("notes.editor.tagsLabel")}
          selectedIds={tagIds}
          onChange={setTagIds}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateField
            label={t("tasks.editor.dateLabel")}
            value={dueDate}
            onChange={(nextDate) => {
              setDueDate(nextDate);
              if (!nextDate) {
                setRemindTime(undefined);
              }
            }}
            error={formatError(errors.dueDate, t("tasks.editor.dateLabel"))}
          />
          <TimeField
            label={t("notes.editor.remindTimeLabel")}
            value={remindTime}
            onChange={(nextTime) => {
              setRemindTime(nextTime);
              if (nextTime && !dueDate) {
                setDueDate(toISODate(new Date()));
              }
            }}
            error={formatError(
              errors.remindTime,
              t("notes.editor.remindTimeLabel"),
            )}
          />
        </div>

        {submitErrorKey && (
          <p role="alert" className="text-body-sm text-error">
            {t(submitErrorKey)}
          </p>
        )}
      </form>
    </Dialog>
  );
}
