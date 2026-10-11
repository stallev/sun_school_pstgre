import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

/**
 * PrismaClient factory (Prisma 7 requires a driver adapter).
 * The application connects through the pooled DATABASE_URL; DIRECT_URL is for CLI and seed only.
 * The environment marker guard (INV-24) is added in P01 together with the reference seed.
 */
export function createPrismaClient(connectionString: string): PrismaClient {
  if (!connectionString) {
    throw new Error("createPrismaClient: connection string is empty");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export type { PrismaClient };
