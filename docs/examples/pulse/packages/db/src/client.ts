import "server-only";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const LEGACY_PG_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

/** Align with pg v9 / pg-connection-string v3: explicit verify-full silences deprecation warning. */
function normalizePgConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode");
    if (sslmode && LEGACY_PG_SSL_MODES.has(sslmode)) {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return new Pool({ connectionString: normalizePgConnectionString(connectionString) });
}

function createPrismaClient(): PrismaClient {
  const pool = globalForPrisma.pool ?? createPool();
  globalForPrisma.pool = pool;
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export async function disconnectPrisma(): Promise<void> {
  const client = globalForPrisma.prisma;
  const pool = globalForPrisma.pool;
  globalForPrisma.prisma = undefined;
  globalForPrisma.pool = undefined;
  if (client) {
    await client.$disconnect();
  }
  if (pool) {
    await pool.end();
  }
}

export { PrismaClient };
export type * from "./generated/client";
