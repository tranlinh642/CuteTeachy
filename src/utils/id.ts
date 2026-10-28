import { generateClientUuid, isUuid, withClientId } from '@/lib/sync';

/** Generates a unique string ID (UUID v4) */
export const createId = (): string => generateClientUuid();

export { generateClientUuid, isUuid, withClientId };
