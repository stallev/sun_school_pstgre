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
/** One connect retry per process (ADR-019); parallel callers share the same attempt. */
let connectionRetryConsumed = false;
let terminalConnectionError: unknown;
let cachedPrisma: Promise<PrismaClient> | undefined;
let inflightConnect: Promise<PrismaClient> | undefined;

export function isRetryablePrismaConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.message.includes("timeout exceeded when trying to connect")) return true;
  const code = (error as NodeJS.ErrnoException).code;
  return code === "ECONNRESET";
}

const resetPrismaClient = (): void => {
  client = undefined;
  guarded = undefined;
};

const connectPrisma = async (): Promise<PrismaClient> => {
  const env = getServerEnv();
  client ??= createPrismaClient(env.DATABASE_URL);
  const db = client;
  guarded ??= assertDbEnvironment(db, env.APP_ENV, { allowMarkerWrite: false }).then(
    () => undefined,
    (error: unknown) => {
      guarded = undefined;
      throw error;
    },
  );
  await guarded;
  return db;
};

const connectWithAtMostOneRetry = async (): Promise<PrismaClient> => {
  try {
    return await connectPrisma();
  } catch (error) {
    if (!isRetryablePrismaConnectionError(error) || connectionRetryConsumed) {
      resetPrismaClient();
      throw error;
    }
    connectionRetryConsumed = true;
    resetPrismaClient();
    try {
      return await connectPrisma();
    } catch (retryError) {
      resetPrismaClient();
      terminalConnectionError = retryError;
      throw retryError;
    }
  }
};

export function getPrisma(): Promise<PrismaClient> {
  if (cachedPrisma) {
    return cachedPrisma;
  }

  if (inflightConnect) {
    return inflightConnect;
  }

  if (connectionRetryConsumed && client === undefined) {
    return Promise.reject(terminalConnectionError);
  }

  inflightConnect = connectWithAtMostOneRetry()
    .then((connectedClient) => {
      cachedPrisma = Promise.resolve(connectedClient);
      return connectedClient;
    })
    .finally(() => {
      inflightConnect = undefined;
    });
  return inflightConnect;
}
