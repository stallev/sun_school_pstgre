import "server-only";
import { assertDbEnvironment, createPrismaClient, type PrismaClient } from "@sunschool/db";
import { getServerEnv } from "@/lib/env.server";

/**
 * The application's PrismaClient (pooled DATABASE_URL, PKG: only `packages/db` talks to Prisma, the
 * app gets the client from here). The environment guard (INV-24) runs once per process before the
 * first query is returned to a caller: an `APP_ENV` / database-marker mismatch aborts, nothing is written.
 */
let client: PrismaClient | undefined;
let guarded: Promise<void> | undefined;

export async function getPrisma(): Promise<PrismaClient> {
  const env = getServerEnv();
  client ??= createPrismaClient(env.DATABASE_URL);
  const db = client;
  guarded ??= assertDbEnvironment(db, env.APP_ENV, { allowMarkerWrite: false }).then(
    () => undefined,
    (error: unknown) => {
      // Allow a retry after the operator fixes the environment, but never serve a guarded-out client.
      guarded = undefined;
      throw error;
    },
  );
  await guarded;
  return db;
}
