import "server-only";
import {
  MUTATION_ERROR_CODES,
  overrideVerseScoreInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId } from "../lessons/lesson-shared.server";
import { overrideVerseScoreInTransaction } from "./check-shared.server";

export async function overrideVerseScore(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ checkId: string; updatedAt: string }>> {
  const parsed = overrideVerseScoreInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return overrideVerseScoreInTransaction(tx, actorUserId, organizationId, parsed.data);
  });
}
