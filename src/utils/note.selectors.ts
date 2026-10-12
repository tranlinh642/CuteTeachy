import type { ID, Note, Tag } from '@/types';

export interface NoteFilter {
  readonly tagId?: ID | null;
  readonly query?: string;
}

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

/** Accent-insensitive search (works for Vietnamese) + tag filter. */
export const filterNotes = (notes: readonly Note[], { tagId, query }: NoteFilter): Note[] => {
  const needle = query ? normalize(query) : '';
  return notes.filter((note) => {
    if (tagId && !note.tagIds.includes(tagId)) return false;
    if (!needle) return true;
    const haystack = [note.title, note.content ?? '', ...note.checklist.map((item) => item.text)].join(' ');
    return normalize(haystack).includes(needle);
  });
};

export const checklistProgress = (note: Note): { done: number; total: number } => ({
  done: note.checklist.filter((item) => item.done).length,
  total: note.checklist.length,
});

/** Resolves tag ids to tags, silently dropping unknown ids. */
export const resolveTags = (tagIds: readonly ID[], tags: readonly Tag[]): Tag[] => {
  const byId = new Map(tags.map((tag) => [tag.id, tag]));
  return tagIds.flatMap((id) => {
    const tag = byId.get(id);
    return tag ? [tag] : [];
  });
};
