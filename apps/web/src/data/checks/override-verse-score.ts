import "server-only";
import {
  MUTATION_ERROR_CODES,
  overrideVerseScoreInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId } from "../lessons/lesson-shared.server";
import type { YearSnapshotCacheTargets } from "../analytics/years/create-year-snapshots";
import { revalidateYearSnapshotCaches } from "../analytics/years/revalidate-year-snapshot-cache";
import { overrideVerseScoreInTransaction } from "./check-shared.server";

type OverrideVerseScoreSuccess = {
  checkId: string;
  updatedAt: string;
  yearSnapshotCache?: YearSnapshotCacheTargets;
};

export async function overrideVerseScore(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<OverrideVerseScoreSuccess>> {
  const parsed = overrideVerseScoreInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const result = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return {
        ok: false as const,
        code: MUTATION_ERROR_CODES.NOT_FOUND,
        message: "common.errors.not_found",
      };
    }
    return overrideVerseScoreInTransaction(tx, actorUserId, organizationId, parsed.data);
  });

  if (result.ok && result.data.yearSnapshotCache) {
    revalidateYearSnapshotCaches(result.data.yearSnapshotCache);
  }

  return result;
}
