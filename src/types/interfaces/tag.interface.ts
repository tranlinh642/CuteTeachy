import type { ID, ISODateTime, Tone } from './common.interface';

/** Label used to categorise tasks & notes by class, priority or subject. */
export interface Tag {
  readonly id: ID;
  readonly name: string;
  readonly tone: Tone;
  readonly updatedAt?: ISODateTime;
}

export interface CreateTagInput {
  readonly id?: ID;
  readonly name: string;
  readonly tone: Tone;
}

export interface UpdateTagInput {
  readonly name?: string;
  readonly tone?: Tone;
}
