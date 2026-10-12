import type { ID, Tone } from './common.interface';

/** Label used to categorise tasks & notes by class, priority or subject. */
export interface Tag {
  readonly id: ID;
  readonly name: string;
  readonly tone: Tone;
}

export type CreateTagInput = Omit<Tag, 'id'>;

export type UpdateTagInput = Partial<CreateTagInput>;
