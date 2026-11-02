import "server-only";

import {
  ACHIEVEMENT_SUGGESTION_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  AWARD_SOURCE,
  MUTATION_ERROR_CODES,
  type MutationErr,
  type MutationResult,
} from "@sunschool/domain";
import { Prisma, writeAudit, type PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { lockPupilRow } from "../school/school-pupil-shared.server";
import { revalidateBricksCaches } from "../bricks/revalidate-bricks-cache";
import { buildAchievementRuleSnapshot } from "./achievement-award-snapshot.server";
import {
  loadGroupAchievementPointsOverrides,
  resolveRewardTierPoints,
} from "./group-achievement-points.server";
import {
  prepareSuggestionResolution,
  runSuggestionTransaction,
  SuggestionRollback,
  suggestionIdInputSchema,
  suggestionResolvedError,
} from "./suggestion-resolve-shared.server";

export type ConfirmSuggestionSuccess = { suggestionId: string; awardId: string; pupilId: string };

const evidenceTakenError: MutationErr = {
  ok: false,
  code: MUTATION_ERROR_CODES.ACHIEVEMENT_EVIDENCE_TAKEN,
  message: "teacher.achievements.evidence_taken",
};

const notFoundError: MutationErr = {
  ok: false,
  code: MUTATION_ERROR_CODES.ACHIEVEMENT_SUGGESTION_NOT_FOUND,
  message: "teacher.achievements.suggestion_not_found",
};

/**
 * suggestions contract section 6.2. One interactive transaction under the pupil row lock.
 * Every check that can fail runs before the first write (a returned error does not roll back);
 * the conditional claim and the award go last. A caught P2002 would leave the Postgres
 * transaction aborted (25P02), so uniqueness is pre-checked and a race P2002 is mapped outside.
 */
export async function confirmAchievementSuggestion(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<ConfirmSuggestionSuccess>> {
  const parsed = suggestionIdInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const bricks = { pupilId: null as string | null, yearId: null as string | null };

  let result: MutationResult<ConfirmSuggestionSuccess>;
  try {
    result = await runSuggestionTransaction<MutationResult<ConfirmSuggestionSuccess>>(
      db,
      async (tx) => {
        const prepared = await prepareSuggestionResolution(tx, actorUserId, parsed.data.suggestionId, {
          requireMode: true,
        });
        if ("error" in prepared) return prepared.error;
        const { suggestion } = prepared;

        if (!(await lockPupilRow(tx, suggestion.pupilId))) return notFoundError;

        // Re-read under the lock: a concurrent resolution may have finished meanwhile.
        const fresh = await tx.achievementSuggestion.findUnique({
          where: { id: suggestion.id },
          select: { status: true },
        });
        if (fresh?.status !== ACHIEVEMENT_SUGGESTION_STATUS.SUGGESTED) return suggestionResolvedError;

        const achievement = await tx.achievement.findUnique({
          where: { id: suggestion.achievementId },
          select: {
            code: true,
            ruleType: true,
            metric: true,
            threshold: true,
            isActive: true,
            tiers: { where: { tier: suggestion.tier } },
          },
        });
        const catalogTier = achievement?.tiers[0];
        if (!achievement || !catalogTier) return notFoundError;
        if (!achievement.isActive) {
          return {
            ok: false,
            code: MUTATION_ERROR_CODES.ACHIEVEMENT_INACTIVE,
            message: "teacher.achievements.inactive",
          };
        }

        const [takenAward, takenEvidence, ownChecks] = await Promise.all([
          tx.achievementAward.findUnique({
            where: { awardKey: suggestion.awardKey },
            select: { id: true },
          }),
          tx.achievementEvidence.findFirst({
            where: {
              achievementId: suggestion.achievementId,
              tier: suggestion.tier,
              checkId: { in: suggestion.evidenceCheckIds },
            },
            select: { id: true },
          }),
          tx.homeworkCheck.count({
            where: {
              id: { in: suggestion.evidenceCheckIds },
              pupilId: suggestion.pupilId,
              homeworkChecked: true,
              lesson: { academicYearId: suggestion.academicYearId },
            },
          }),
        ]);
        if (takenAward || takenEvidence) return evidenceTakenError;
        if (ownChecks !== suggestion.evidenceCheckIds.length) return notFoundError;

        const overrides = await loadGroupAchievementPointsOverrides(
          tx,
          suggestion.gradeId,
          suggestion.academicYearId,
        );
        const effective = resolveRewardTierPoints(
          catalogTier.points,
          overrides,
          suggestion.achievementId,
          suggestion.tier,
        );

        const resolvedAt = new Date();
        const award = await tx.achievementAward.create({
          data: {
            pupilId: suggestion.pupilId,
            achievementId: suggestion.achievementId,
            tier: suggestion.tier,
            academicYearId: suggestion.academicYearId,
            points: effective.points,
            ruleSnapshot: {
              ...(buildAchievementRuleSnapshot(
                achievement,
                { tier: catalogTier.tier, length: catalogTier.length, points: effective.points },
                { pointsSource: effective.pointsSource, gradeId: suggestion.gradeId },
              ) as Prisma.JsonObject),
              suggestionId: suggestion.id,
            },
            source: AWARD_SOURCE.AUTO,
            awardedById: actorUserId,
            awardedAt: resolvedAt,
            awardKey: suggestion.awardKey,
            evidence: {
              create: suggestion.evidenceCheckIds.map((checkId) => ({
                achievementId: suggestion.achievementId,
                tier: suggestion.tier,
                checkId,
              })),
            },
          },
          select: { id: true },
        });

        // Status and award_id must change together (CHECK award_status). Count 0 rolls the award back.
        const claimed = await tx.achievementSuggestion.updateMany({
          where: { id: suggestion.id, status: ACHIEVEMENT_SUGGESTION_STATUS.SUGGESTED },
          data: {
            status: ACHIEVEMENT_SUGGESTION_STATUS.CONFIRMED,
            resolvedById: actorUserId,
            resolvedAt,
            awardId: award.id,
          },
        });
        if (claimed.count === 0) throw new SuggestionRollback(suggestionResolvedError);

        await writeAudit(tx, {
          actorUserId,
          source: AUDIT_SOURCE.USER,
          entityType: AUDIT_ENTITY_TYPE.ACHIEVEMENT_SUGGESTION,
          entityId: suggestion.id,
          action: AUDIT_ACTION.ACHIEVEMENT_SUGGESTION_CONFIRMED,
          newValue: {
            suggestionId: suggestion.id,
            awardId: award.id,
            pupilId: suggestion.pupilId,
            points: effective.points,
            closedYearOverride: suggestion.yearIsClosed,
          },
        });

        bricks.pupilId = suggestion.pupilId;
        bricks.yearId = suggestion.academicYearId;
        return {
          ok: true,
          data: { suggestionId: suggestion.id, awardId: award.id, pupilId: suggestion.pupilId },
        };
      },
    );
  } catch (error) {
    // Race with a path that does not take the pupil lock: the transaction is already rolled back.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return evidenceTakenError;
    }
    throw error;
  }

  if (result.ok && bricks.pupilId && bricks.yearId) {
    revalidateBricksCaches(bricks.pupilId, bricks.yearId);
  }
  return result;
}
