import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "./generated/prisma/client";

/**
 * Prisma interactive defaults are maxWait 2s and timeout 5s.
 * Against Neon a page holds the pool with many short transactions, so a new one
 * fails to start (P2028, empty meta), and a check save of sequential statements
 * expires before it finishes (P2028, timeout 5000). Call sites that pass their
 * own options (year close, seed) still override these.
 */
const INTERACTIVE_TRANSACTION_MAX_WAIT_MS = 10_000;
const INTERACTIVE_TRANSACTION_TIMEOUT_MS = 30_000;

const INTERACTIVE_TRANSACTION_OPTIONS = {
  maxWait: INTERACTIVE_TRANSACTION_MAX_WAIT_MS,
  timeout: INTERACTIVE_TRANSACTION_TIMEOUT_MS,
} as const;

/** ADR-019 Q-3: cap concurrent connections per serverless instance (Neon pooler). */
export const PRISMA_POOL_MAX = 4;
export const PRISMA_POOL_IDLE_TIMEOUT_MS = 10_000;
export const PRISMA_POOL_CONNECTION_TIMEOUT_MS = 5_000;

export type DbReader = PrismaClient | Prisma.TransactionClient;

const shouldLogQueries =
  process.env.DB_QUERY_LOG === "1" && process.env.APP_ENV === "dev";

/**
 * PrismaClient factory (Prisma 7 requires a driver adapter).
 * The application connects through the pooled DATABASE_URL; DIRECT_URL is for CLI and seed only.
 * The environment marker guard (INV-24) is added in P01 together with the reference seed.
 */
export function createPrismaClient(connectionString: string): PrismaClient {
  if (!connectionString) {
    throw new Error("createPrismaClient: connection string is empty");
  }
  const adapter = new PrismaPg({
    connectionString,
    max: PRISMA_POOL_MAX,
    idleTimeoutMillis: PRISMA_POOL_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: PRISMA_POOL_CONNECTION_TIMEOUT_MS,
  });
  const baseOptions = {
    adapter,
    transactionOptions: INTERACTIVE_TRANSACTION_OPTIONS,
  } as const;

  if (!shouldLogQueries) {
    return new PrismaClient(baseOptions);
  }

  const client = new PrismaClient({
    ...baseOptions,
    log: [{ emit: "event", level: "query" }],
  });
  client.$on("query", (event) => {
    console.log(`[db] ${event.duration}ms ${event.query}`);
  });
  return client;
}

export type { PrismaClient };
