import "server-only";

import { z } from "zod";
import {
  ACHIEVEMENT_SUGGESTION_STATUS,
  MUTATION_ERROR_CODES,
  type MutationErr,
} from "@sunschool/domain";
import type { Prisma, PrismaClient } from "@sunschool/db";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { readFeaturesAchievementsEnabled } from "./achievement-feature.server";
import {
  assertResolveSuggestionAccess,
  type ResolvableSuggestion,
} from "./achievement-mutate-access.server";
import { isLessonInAchievementOffPeriod, loadGradeAchievementMode } from "./achievement-mode.server";

type Tx = Prisma.TransactionClient;

export const suggestionIdInputSchema = z.object({ suggestionId: z.string().uuid() }).strict();

/** Thrown inside a transaction to roll it back; mapped to a MutationResult outside. */
export class SuggestionRollback extends Error {
  constructor(readonly failure: MutationErr) {
    super(failure.code);
  }
}

export const suggestionResolvedError: MutationErr = {
  ok: false,
  code: MUTATION_ERROR_CODES.ACHIEVEMENT_SUGGESTION_RESOLVED,
  message: "teacher.achievements.suggestion_resolved",
};

/**
 * Shared gate of confirm / defer / dismiss (contract section 6.2 step 1): organization, access from
 * the DB, flag, optional group mode at the current instant. Writes nothing.
 */
export async function prepareSuggestionResolution(
  tx: Tx,
  actorUserId: string,
  suggestionId: string,
  options: { requireMode: boolean },
): Promise<{ error: MutationErr } | { suggestion: ResolvableSuggestion }> {
  const organizationId = await loadActorOrganizationId(tx, actorUserId);
  if (!organizationId) {
    return { error: { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" } };
  }

  const access = await assertResolveSuggestionAccess(tx, actorUserId, organizationId, suggestionId);
  if ("error" in access) return access;

  if (!(await readFeaturesAchievementsEnabled(tx))) {
    return {
      error: {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_FLAG_OFF,
        message: "admin.achievements.flag_off",
      },
    };
  }

  if (access.suggestion.status !== ACHIEVEMENT_SUGGESTION_STATUS.SUGGESTED) {
    return { error: suggestionResolvedError };
  }

  if (options.requireMode) {
    const mode = await loadGradeAchievementMode(
      tx,
      access.suggestion.gradeId,
      access.suggestion.academicYearId,
    );
    if (!mode || isLessonInAchievementOffPeriod(new Date(), mode)) {
      return {
        error: {
          ok: false,
          code: MUTATION_ERROR_CODES.ACHIEVEMENT_MODE_OFF,
          message: "teacher.achievements.mode_off",
        },
      };
    }
  }

  return access;
}

/**
 * Runs the interactive transaction; a SuggestionRollback thrown inside aborts it (nothing is
 * committed) and is mapped to its failure here, outside the transaction.
 */
export async function runSuggestionTransaction<T>(
  db: PrismaClient,
  body: (tx: Tx) => Promise<T | MutationErr>,
): Promise<T | MutationErr> {
  try {
    return await db.$transaction(body);
  } catch (error) {
    if (error instanceof SuggestionRollback) return error.failure;
    throw error;
  }
}
