import type { Prisma } from "../../generated/prisma/client";

export type SeedTx = Prisma.TransactionClient;

/** Rows touched by one reference-data step; `{0, 0}` means the database already matched. */
export type SeedCounts = { created: number; updated: number };

export const emptyCounts = (): SeedCounts => ({ created: 0, updated: 0 });

export const addCounts = (a: SeedCounts, b: SeedCounts): SeedCounts => ({
  created: a.created + b.created,
  updated: a.updated + b.updated,
});
