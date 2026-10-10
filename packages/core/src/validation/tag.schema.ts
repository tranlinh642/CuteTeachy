import { toneNames, type Tone } from '@cute-teachy/tokens';
import { z } from 'zod';
import { LIMITS } from './limits';

export const tagSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(LIMITS.tagNameMax, 'validation.maxLength'),
  tone: z.enum(toneNames as [Tone, ...Tone[]]),
});

export type TagFormValues = z.input<typeof tagSchema>;
