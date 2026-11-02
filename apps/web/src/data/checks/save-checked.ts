import "server-only";
import {
  MUTATION_ERROR_CODES,
  saveCheckedInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId } from "../lessons/lesson-shared.server";
import { revalidateBricksCachesForLessonCheck } from "../bricks/revalidate-bricks-cache";
import { revalidateAnalyticsCachesForLessonCheck } from "../analytics/revalidate-analytics-cache";
import { loadCheckSchoolTimeZone, saveCheckInTransaction } from "./check-shared.server";

export async function saveChecked(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ checkId: string; updatedAt: string }>> {
  const parsed = saveCheckedInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const [organizationId, schoolTimeZone] = await Promise.all([
    loadActorOrganizationId(db, actorUserId),
    loadCheckSchoolTimeZone(db),
  ]);
  if (!organizationId) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    };
  }

  const result = await db.$transaction(async (tx) =>
    saveCheckInTransaction(tx, actorUserId, organizationId, parsed.data, "checked", schoolTimeZone),
  );
  if (result.ok) {
    await revalidateBricksCachesForLessonCheck(db, parsed.data.pupilId, parsed.data.lessonId);
    await revalidateAnalyticsCachesForLessonCheck(db, parsed.data.pupilId, parsed.data.lessonId);
  }
  return result;
}
