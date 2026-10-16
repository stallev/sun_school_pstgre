import "server-only";
import type { PrismaClient } from "@sunschool/db";
import { purgeExpiredRegistrations } from "./purge-expired-registration";

/** Lazy purge on admin screens (access_requests §5.10, P01-T21). */
export async function runAdminLazyPurge(db: PrismaClient, now: Date): Promise<number> {
  return db.$transaction((tx) => purgeExpiredRegistrations(tx, now));
}
