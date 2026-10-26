import type { ID, ISODate, Timestamps } from './common.interface';

export interface ChecklistItem {
  readonly id: ID;
  readonly text: string;
  readonly done: boolean;
}

/** Notes & To-Dos: free text, checklist and/or image, categorised by tags. */
export interface Note extends Timestamps {
  readonly id: ID;
  readonly title: string;
  readonly content?: string;
  readonly checklist: readonly ChecklistItem[];
  readonly imageUrl?: string;
  readonly tagIds: readonly ID[];
  readonly dueDate?: ISODate;
  readonly completed: boolean;
}

export type CreateNoteInput = Pick<Note, 'title'> &
  Partial<Pick<Note, 'content' | 'checklist' | 'imageUrl' | 'tagIds' | 'dueDate' | 'completed'>> & {
    id?: ID;
  };

export type UpdateNoteInput = Partial<Omit<Note, 'id' | keyof Timestamps>>;
