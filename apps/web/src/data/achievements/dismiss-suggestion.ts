import "server-only";

import { z } from "zod";
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
  suggestionResolvedError,
} from "./suggestion-resolve-shared.server";

const SUGGESTION_REASON_MAX_LENGTH = 500;

const dismissInputSchema = z
  .object({
    suggestionId: z.string().uuid(),
    reason: z.string().trim().max(SUGGESTION_REASON_MAX_LENGTH).optional(),
  })
  .strict();

export type DismissSuggestionSuccess = { suggestionId: string; pupilId: string };

/** suggestions contract section 6.4: group mode is not required to dismiss. */
export async function dismissAchievementSuggestion(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<DismissSuggestionSuccess>> {
  const parsed = dismissInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);
  const reason = parsed.data.reason ? parsed.data.reason : null;

  return runSuggestionTransaction<MutationResult<DismissSuggestionSuccess>>(db, async (tx) => {
    const prepared = await prepareSuggestionResolution(tx, actorUserId, parsed.data.suggestionId, {
      requireMode: false,
    });
    if ("error" in prepared) return prepared.error;
    const { suggestion } = prepared;

    const claimed = await tx.achievementSuggestion.updateMany({
      where: { id: suggestion.id, status: ACHIEVEMENT_SUGGESTION_STATUS.SUGGESTED },
      data: {
        status: ACHIEVEMENT_SUGGESTION_STATUS.DISMISSED,
        resolvedById: actorUserId,
        resolvedAt: new Date(),
      },
    });
    if (claimed.count === 0) throw new SuggestionRollback(suggestionResolvedError);

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.ACHIEVEMENT_SUGGESTION,
      entityId: suggestion.id,
      action: AUDIT_ACTION.ACHIEVEMENT_SUGGESTION_DISMISSED,
      newValue: {
        suggestionId: suggestion.id,
        pupilId: suggestion.pupilId,
        closedYearOverride: suggestion.yearIsClosed,
      },
      reason,
    });
    return { ok: true, data: { suggestionId: suggestion.id, pupilId: suggestion.pupilId } };
  });
}
