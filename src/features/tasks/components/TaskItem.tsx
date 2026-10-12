'use client';

import { formatTime } from '@/utils';
import { useTranslation } from '@/lib/i18n';
import type { Tag, Task } from '@/types';
import { Checkbox, IconButton, TagChip } from '@/components/ui';
import { cn } from '@/utils/cn';

export interface TaskItemProps {
  readonly task: Task;
  readonly tags?: readonly Tag[];
  readonly onToggle: (task: Task) => void;
  readonly onEdit?: (task: Task) => void;
  readonly onDelete?: (task: Task) => void;
  readonly className?: string;
}

export function TaskItem({
  task,
  tags = [],
  onToggle,
  onEdit,
  onDelete,
  className,
}: TaskItemProps) {
  const { t, localeTag } = useTranslation();
  const isHigh = task.priority === 'high';
  const subtitle = task.time ? t('weekly.dueAt', { time: formatTime(task.time, localeTag) }) : task.notes;

  return (
    <article
      className={cn(
        'group flex items-start gap-3 rounded-xl p-3.5 transition-all shadow-xs',
        isHigh
          ? 'bg-rose-50 border border-rose-200/60'
          : 'bg-primary-container/30 border border-primary-container/40',
        task.completed && 'opacity-60',
        className,
      )}
    >
      <div className="pt-0.5">
        <Checkbox
          checked={task.completed}
          onChange={() => onToggle(task)}
          label={task.title}
          hideLabel
        />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-title-md font-medium text-on-surface truncate',
            task.completed && 'line-through text-on-surface-variant',
          )}
        >
          {task.title}
        </p>
        {subtitle && (
          <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">
            {subtitle}
          </p>
        )}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <TagChip key={tag.id} name={tag.name} tone={tag.tone} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <IconButton
            icon="edit"
            size="sm"
            aria-label={`${t('common.actions.edit')}: ${task.title}`}
            onClick={() => onEdit(task)}
          />
        )}
        {onDelete && (
          <IconButton
            icon="delete"
            size="sm"
            aria-label={`${t('common.actions.delete')}: ${task.title}`}
            onClick={() => onDelete(task)}
            className="hover:text-error"
          />
        )}
      </div>
    </article>
  );
}
