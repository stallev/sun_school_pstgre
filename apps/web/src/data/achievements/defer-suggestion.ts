import "server-only";

import {
  ACHIEVEMENT_SUGGESTION_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  prepareSuggestionResolution,
  runSuggestionTransaction,
  SuggestionRollback,
  suggestionIdInputSchema,
  suggestionResolvedError,
} from "./suggestion-resolve-shared.server";

export type DeferSuggestionSuccess = { suggestionId: string; pupilId: string };

/** suggestions contract section 6.3: status stays SUGGESTED, only `deferred_at` moves. */
export async function deferAchievementSuggestion(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<DeferSuggestionSuccess>> {
  const parsed = suggestionIdInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return runSuggestionTransaction<MutationResult<DeferSuggestionSuccess>>(db, async (tx) => {
    const prepared = await prepareSuggestionResolution(tx, actorUserId, parsed.data.suggestionId, {
      requireMode: true,
    });
    if ("error" in prepared) return prepared.error;
    const { suggestion } = prepared;

    const claimed = await tx.achievementSuggestion.updateMany({
      where: { id: suggestion.id, status: ACHIEVEMENT_SUGGESTION_STATUS.SUGGESTED },
      data: { deferredAt: new Date() },
    });
    if (claimed.count === 0) throw new SuggestionRollback(suggestionResolvedError);

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.ACHIEVEMENT_SUGGESTION,
      entityId: suggestion.id,
      action: AUDIT_ACTION.ACHIEVEMENT_SUGGESTION_DEFERRED,
      newValue: {
        suggestionId: suggestion.id,
        pupilId: suggestion.pupilId,
        closedYearOverride: suggestion.yearIsClosed,
      },
    });
    return { ok: true, data: { suggestionId: suggestion.id, pupilId: suggestion.pupilId } };
  });
}
