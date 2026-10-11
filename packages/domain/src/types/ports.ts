/**
 * Ports — what `domain` needs from the outside world (clock, ids).
 * Implementations live in apps/web or packages/db. `domain` never reads the system clock itself.
 */
export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  uuid(): string;
}
