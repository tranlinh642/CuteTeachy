/**
 * @cute-teachy/types – single source of truth for domain interfaces.
 *
 * One file per domain under `./interfaces`; this barrel only re-exports.
 * When the NestJS DTOs change, update the matching `*.interface.ts` file.
 */
export * from './interfaces/common.interface';
export * from './interfaces/user.interface';
export * from './interfaces/auth.interface';
export * from './interfaces/tag.interface';
export * from './interfaces/task.interface';
export * from './interfaces/note.interface';
export * from './interfaces/class-session.interface';
export * from './interfaces/inspiration.interface';
export * from './interfaces/agenda.interface';
