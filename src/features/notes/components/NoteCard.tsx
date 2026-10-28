"use client";

import { checklistProgress, formatShortDate } from "@/utils";
import { useTranslation } from "@/lib/i18n";
import type { ID, Note, Tag } from "@/types";
import { Card, Checkbox, Chip, IconButton, TagChip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { useUpdateNote } from "../api";

export interface NoteCardProps {
  readonly note: Note;
  readonly tags?: readonly Tag[];
  readonly onToggleItem?: (note: Note, itemId: ID) => void;
  readonly onEdit?: (note: Note) => void;
  readonly onDelete?: (note: Note) => void;
  readonly className?: string;
}

export function NoteCard({
  note,
  tags = [],
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
      className={cn(
        "group flex flex-col gap-3 transition-all hover:shadow-md",
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
            {note.dueDate && (
              <p className="text-label-md text-primary font-medium mt-0.5">
                {t("weekly.dueAt", {
                  time: formatShortDate(new Date(note.dueDate), localeTag),
                })}
              </p>
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
            <label
              key={item.id}
              className="flex items-center gap-2 cursor-pointer text-body-sm hover:opacity-80"
            >
              <Checkbox
                checked={item.done}
                onChange={() => onToggleItem?.(note, item.id)}
                label={item.text}
                hideLabel
              />
              <span
                className={cn(
                  "flex-1 text-on-surface",
                  item.done && "line-through text-on-surface-variant",
                )}
              >
                {item.text}
              </span>
            </label>
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
