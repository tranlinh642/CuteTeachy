const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Checks whether a given string matches RFC 4122 UUID format.
 */
export const isUuid = (value: string): boolean => UUID_REGEX.test(value);

/**
 * Generates an RFC 4122 version 4 UUID.
 * Uses native Web Crypto `crypto.randomUUID` when available, with a standard fallback.
 */
export const generateClientUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // RFC 4122 v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

/**
 * Ensures an entity payload has a client UUID.
 *
 * If `existingId` or `input.id` is already provided (e.g. offline mutation retry or optimistic record),
 * it preserves that ID verbatim so retries remain idempotent.
 */
export const withClientId = <T extends object>(
  input: T,
  existingId?: string,
): T & { id: string } => {
  const currentId = (input as { id?: unknown }).id;
  const resolvedId =
    typeof existingId === 'string' && existingId.trim().length > 0
      ? existingId
      : typeof currentId === 'string' && currentId.trim().length > 0
        ? currentId
        : generateClientUuid();

  return {
    ...input,
    id: resolvedId,
  };
};
