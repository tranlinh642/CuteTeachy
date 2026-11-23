"use client";

import { checklistProgress, formatShortDate, formatTime, parseISODate } from "@/utils";
import { useTranslation } from "@/lib/i18n";
import type { ID, ISODate, Note, Tag } from "@/types";
import { Card, Checkbox, Chip, Icon, IconButton, TagChip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { useUpdateNote } from "../api";

export interface NoteCardProps {
  readonly note: Note;
  readonly tags?: readonly Tag[];
  readonly highlighted?: boolean;
  readonly onToggleItem?: (note: Note, itemId: ID) => void;
  readonly onEdit?: (note: Note) => void;
  readonly onDelete?: (note: Note) => void;
  readonly className?: string;
}

export function NoteCard({
  note,
  tags = [],
  highlighted = false,
  onToggleItem,
  onEdit,
  onDelete,
  className,
}: NoteCardProps) {
  const { t, localeTag } = useTranslation();
  const updateNote = useUpdateNote();
  const { done, total } = checklistProgress(note);

  const hasChecklist = note.checklist.length > 0;
  const isCompleted = hasChecklist
    ? done === total && total > 0
    : Boolean(note.completed);

  return (
    <Card
      as="article"
      variant="elevated"
      padding="md"
      data-note-id={note.id}
      data-highlighted={highlighted ? "true" : undefined}
      className={cn(
        "group flex flex-col gap-3 transition-all hover:shadow-md",
        highlighted && "ring-2 ring-primary",
        isCompleted && "opacity-60",
        className,
      )}
    >
      {/* Header: Title + Due date + Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {!hasChecklist && (
            <div className="pt-0.5">
              <Checkbox
                checked={Boolean(note.completed)}
                onChange={() =>
                  updateNote.mutate({
                    id: note.id,
                    input: { completed: !note.completed },
                  })
                }
                label={note.title}
                hideLabel
                shape="circle"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "text-title-md font-bold text-on-surface line-clamp-2",
                isCompleted && "line-through text-on-surface-variant",
              )}
            >
              {note.title}
            </h3>
            {(note.dueDate || note.remindTime) && (
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                {note.dueDate && (
                  <p className="text-label-md text-primary font-medium">
                    {t("weekly.dueAt", {
                      time: formatShortDate(
                        parseISODate(note.dueDate.slice(0, 10) as ISODate),
                        localeTag,
                      ),
                    })}
                  </p>
                )}
                {note.remindTime && (
                  <span
                    data-testid="note-remind-time"
                    className="inline-flex items-center gap-1 rounded-full bg-primary-container/60 px-2 py-0.5 text-label-sm font-medium text-on-primary-container"
                  >
                    <Icon name="clock" size={14} />
                    <span>{formatTime(note.remindTime, localeTag)}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {total > 0 && (
            <Chip
              label={`${done}/${total}`}
              icon="checklist"
              className="text-xs"
            />
          )}
          {onEdit && (
            <IconButton
              icon="edit"
              size="sm"
              aria-label={`${t("common.actions.edit")}: ${note.title}`}
              onClick={() => onEdit(note)}
            />
          )}
          {onDelete && (
            <IconButton
              icon="delete"
              size="sm"
              aria-label={`${t("common.actions.delete")}: ${note.title}`}
              onClick={() => onDelete(note)}
              className="hover:text-error"
            />
          )}
        </div>
      </div>

      {/* Nội dung text nếu có */}
      {note.content && (
        <p className="text-body-sm text-on-surface-variant line-clamp-4 whitespace-pre-line">
          {note.content}
        </p>
      )}

      {/* Danh sách checklist */}
      {total > 0 && (
        <div className="flex flex-col gap-1.5 pt-1">
          {note.checklist.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 text-body-sm hover:opacity-80"
            >
              <Checkbox
                checked={item.done}
                onChange={() => onToggleItem?.(note, item.id)}
                label={item.text}
                hideLabel
              />
              <button
                type="button"
                onClick={() => onToggleItem?.(note, item.id)}
                className={cn(
                  'flex-1 text-left cursor-pointer text-on-surface',
                  item.done && 'line-through text-on-surface-variant',
                )}
              >
                {item.text}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <TagChip key={tag.id} name={tag.name} tone={tag.tone} />
          ))}
        </div>
      )}
    </Card>
  );
}
