import "server-only";
import {
  MUTATION_ERROR_CODES,
  correctCheckInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId } from "../lessons/lesson-shared.server";
import { revalidateBricksCachesForLessonCheck } from "../bricks/revalidate-bricks-cache";
import { revalidateAnalyticsCachesForLessonCheck } from "../analytics/revalidate-analytics-cache";
import { revalidateYearSnapshotCaches } from "../analytics/years/revalidate-year-snapshot-cache";
import { correctCheckInTransaction } from "./check-shared.server";

export async function correctCheck(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ checkId: string; updatedAt: string }>> {
  const parsed = correctCheckInputSchema.safeParse(raw);
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
    return correctCheckInTransaction(tx, actorUserId, organizationId, parsed.data);
  });
  if (result.ok) {
    await revalidateBricksCachesForLessonCheck(db, parsed.data.pupilId, parsed.data.lessonId);
    await revalidateAnalyticsCachesForLessonCheck(db, parsed.data.pupilId, parsed.data.lessonId);
    if (result.data.yearSnapshotCache) {
      revalidateYearSnapshotCaches(result.data.yearSnapshotCache);
    }
  }
  return result;
}
