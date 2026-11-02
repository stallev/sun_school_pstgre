import "server-only";

import { z } from "zod";
import {
  ACHIEVEMENT_KIND,
  ACHIEVEMENT_RULE_TYPE,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  AWARD_SOURCE,
  MUTATION_ERROR_CODES,
  buildAchievementAwardKey,
  getCalendarDateInTimeZone,
  type MutationErr,
  type MutationResult,
} from "@sunschool/domain";
import { Prisma, writeAudit, type PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { calendarDateFromIso, isoFromCalendarDate } from "../school/calendar-date";
import { loadActiveEnrollment } from "../school/school-enrollment-shared.server";
import { loadActorOrganizationId, lockPupilRow } from "../school/school-pupil-shared.server";
import { revalidateBricksCaches } from "../bricks/revalidate-bricks-cache";
import { buildAchievementRuleSnapshot } from "./achievement-award-snapshot.server";
import { readFeaturesAchievementsEnabled } from "./achievement-feature.server";
import { assertAwardManuallyAccess } from "./achievement-mutate-access.server";
import { loadGradeAchievementMode } from "./achievement-mode.server";
import {
  loadGroupAchievementPointsOverrides,
  resolveRewardTierPoints,
} from "./group-achievement-points.server";

const SCHOOL_TIMEZONE_KEY = "school_timezone";
const DEFAULT_SCHOOL_TIMEZONE = "UTC";
const EVENT_DATE_INVALID = "teacher.achievements.event_date_invalid";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const awardManuallyInputSchema = z
  .object({
    pupilId: z.string().uuid(),
    achievementId: z.string().uuid(),
    tier: z.number().int().positive(),
    points: z.number().int().min(0),
    reason: z.string().trim().min(1, "teacher.achievements.reason_required"),
    checkIds: z.array(z.string().uuid()).default([]),
    academicYearId: z.string().uuid().optional(),
    eventOn: z
      .string()
      .regex(ISO_DATE_PATTERN, EVENT_DATE_INVALID)
      .refine((value) => isoFromCalendarDate(calendarDateFromIso(value)) === value, EVENT_DATE_INVALID)
      .optional(),
  })
  .strict();

type Tx = Prisma.TransactionClient;

const eventOnFieldError = (): MutationErr => ({
  ok: false,
  code: MUTATION_ERROR_CODES.VALIDATION,
  message: EVENT_DATE_INVALID,
  fields: { eventOn: EVENT_DATE_INVALID },
});

type EventContext = { ok: true; eventOn: string; gradeId: string } | MutationErr;

/** EVENT branch (ADR-016 §4 п. 10): date inside the pupil's year, not in the future; group on that date. */
async function resolveEventContext(
  tx: Tx,
  input: { pupilId: string; academicYearId: string; eventOn: string | undefined; hasChecks: boolean },
): Promise<EventContext> {
  if (input.hasChecks) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "teacher.achievements.event_no_evidence",
      fields: { checkIds: "teacher.achievements.event_no_evidence" },
    };
  }
  if (input.eventOn === undefined) return eventOnFieldError();

  const year = await tx.academicYear.findUnique({
    where: { id: input.academicYearId },
    select: { startsOn: true, endsOn: true },
  });
  if (!year) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  const tzRow = await tx.appSetting.findUnique({ where: { key: SCHOOL_TIMEZONE_KEY } });
  const timeZone =
    typeof tzRow?.value === "string" && tzRow.value.trim() !== "" ? tzRow.value : DEFAULT_SCHOOL_TIMEZONE;
  const todayIso = getCalendarDateInTimeZone(new Date(), timeZone);
  if (
    input.eventOn < isoFromCalendarDate(year.startsOn) ||
    input.eventOn > isoFromCalendarDate(year.endsOn) ||
    input.eventOn > todayIso
  ) {
    return eventOnFieldError();
  }

  const eventDate = calendarDateFromIso(input.eventOn);
  const onDate = await tx.enrollment.findFirst({
    where: {
      pupilId: input.pupilId,
      academicYearId: input.academicYearId,
      startsOn: { lte: eventDate },
      OR: [{ endsOn: null }, { endsOn: { gte: eventDate } }],
    },
    orderBy: { startsOn: "desc" },
    select: { gradeId: true },
  });
  if (!onDate) return eventOnFieldError();
  return { ok: true, eventOn: input.eventOn, gradeId: onDate.gradeId };
}

export type AwardManuallySuccess = { awardId: string };

export async function awardManually(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<AwardManuallySuccess>> {
  const parsed = awardManuallyInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const bricksInvalidation = { pupilId: null as string | null, yearId: null as string | null };

  const result: MutationResult<AwardManuallySuccess> = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const access = await assertAwardManuallyAccess(tx, actorUserId, organizationId, parsed.data.pupilId);
    if (access) return access;

    const locked = await lockPupilRow(tx, parsed.data.pupilId);
    if (!locked) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const flagOn = await readFeaturesAchievementsEnabled(tx);
    if (!flagOn) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_FLAG_OFF,
        message: "admin.achievements.flag_off",
      };
    }

    const enrollment = await loadActiveEnrollment(tx, parsed.data.pupilId);
    if (!enrollment) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const academicYearId = parsed.data.academicYearId ?? enrollment.academicYearId;
    if (academicYearId !== enrollment.academicYearId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const mode = await loadGradeAchievementMode(tx, enrollment.gradeId, academicYearId);
    if (!mode?.achievementsEnabled) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_MODE_OFF,
        message: "teacher.achievements.mode_off",
      };
    }

    const achievement = await tx.achievement.findUnique({
      where: { id: parsed.data.achievementId },
      select: {
        id: true,
        code: true,
        kind: true,
        ruleType: true,
        metric: true,
        threshold: true,
        isActive: true,
        tiers: { where: { tier: parsed.data.tier } },
      },
    });
    if (!achievement || achievement.kind !== ACHIEVEMENT_KIND.REWARD) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    if (!achievement.isActive) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_INACTIVE,
        message: "teacher.achievements.inactive",
      };
    }

    const tierRow = achievement.tiers[0];
    if (!tierRow) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const { tier: catalogTier, length: catalogLength, points: catalogTierPoints } = tierRow;

    const isEvent = achievement.ruleType === ACHIEVEMENT_RULE_TYPE.EVENT;
    let ceilingGradeId = enrollment.gradeId;
    let eventOn: string | undefined;
    if (isEvent) {
      const event = await resolveEventContext(tx, {
        pupilId: parsed.data.pupilId,
        academicYearId,
        eventOn: parsed.data.eventOn,
        hasChecks: parsed.data.checkIds.length > 0,
      });
      if (!event.ok) return event;
      ceilingGradeId = event.gradeId;
      eventOn = event.eventOn;
    } else if (parsed.data.eventOn !== undefined) {
      return eventOnFieldError();
    }

    const pointOverrides = await loadGroupAchievementPointsOverrides(
      tx,
      ceilingGradeId,
      academicYearId,
    );
    const effectiveTier = resolveRewardTierPoints(
      catalogTierPoints,
      pointOverrides,
      achievement.id,
      parsed.data.tier,
    );

    if (parsed.data.points > effectiveTier.points) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_POINTS_EXCEED,
        message: "teacher.achievements.points_exceed",
      };
    }

    const needsEvidence = achievement.ruleType !== ACHIEVEMENT_RULE_TYPE.MANUAL && !isEvent;
    const checkIds = parsed.data.checkIds;
    if (needsEvidence && checkIds.length < catalogLength) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACHIEVEMENT_EVIDENCE_SHORT,
        message: "teacher.achievements.evidence_short",
      };
    }

    if (needsEvidence && checkIds.length > 0) {
      const checks = await tx.homeworkCheck.findMany({
        where: {
          id: { in: checkIds },
          pupilId: parsed.data.pupilId,
          homeworkChecked: true,
          lesson: { academicYearId },
        },
        select: { id: true },
      });
      if (checks.length !== checkIds.length) {
        return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
      }

      const occupied = await tx.achievementEvidence.findFirst({
        where: {
          achievementId: parsed.data.achievementId,
          tier: parsed.data.tier,
          checkId: { in: checkIds },
        },
        select: { id: true },
      });
      if (occupied) {
        return {
          ok: false,
          code: MUTATION_ERROR_CODES.ACHIEVEMENT_EVIDENCE_TAKEN,
          message: "teacher.achievements.evidence_taken",
        };
      }
    }

    const awardKey = buildAchievementAwardKey({
      pupilId: parsed.data.pupilId,
      achievementId: parsed.data.achievementId,
      tier: parsed.data.tier,
      academicYearId,
      eventOn,
    });

    if (isEvent) {
      // Checked up front: a P2002 inside the interactive transaction would abort it.
      const sameEvent = await tx.achievementAward.findUnique({
        where: { awardKey },
        select: { id: true },
      });
      if (sameEvent) {
        return {
          ok: false,
          code: MUTATION_ERROR_CODES.CONFLICT,
          message: "common.errors.conflict",
        };
      }
    } else {
      const existingLevel = await tx.achievementAward.findFirst({
        where: {
          pupilId: parsed.data.pupilId,
          achievementId: parsed.data.achievementId,
          tier: parsed.data.tier,
          academicYearId,
        },
        select: { id: true },
      });
      if (existingLevel) {
        return {
          ok: false,
          code: MUTATION_ERROR_CODES.ACHIEVEMENT_EVIDENCE_TAKEN,
          message: "teacher.achievements.evidence_taken",
        };
      }
    }

    const awardedAt = new Date();

    try {
      const award = await tx.achievementAward.create({
        data: {
          pupilId: parsed.data.pupilId,
          achievementId: parsed.data.achievementId,
          tier: parsed.data.tier,
          academicYearId,
          points: parsed.data.points,
          ruleSnapshot: buildAchievementRuleSnapshot(
            achievement,
            { tier: catalogTier, length: catalogLength, points: effectiveTier.points },
            { pointsSource: effectiveTier.pointsSource, gradeId: ceilingGradeId },
          ),
          source: AWARD_SOURCE.MANUAL,
          awardedById: actorUserId,
          reason: parsed.data.reason,
          awardedAt,
          awardKey,
          evidence:
            needsEvidence && checkIds.length > 0
              ? {
                  create: checkIds.map((checkId) => ({
                    achievementId: parsed.data.achievementId,
                    tier: parsed.data.tier,
                    checkId,
                  })),
                }
              : undefined,
        },
        select: { id: true },
      });

      await writeAudit(tx, {
        actorUserId,
        source: AUDIT_SOURCE.USER,
        entityType: AUDIT_ENTITY_TYPE.ACHIEVEMENT_AWARD,
        entityId: award.id,
        action: AUDIT_ACTION.ACHIEVEMENT_AWARDED,
        newValue: {
          awardId: award.id,
          pupilId: parsed.data.pupilId,
          achievementId: parsed.data.achievementId,
          tier: parsed.data.tier,
          ...(eventOn === undefined ? {} : { eventOn }),
        },
      });

      bricksInvalidation.pupilId = parsed.data.pupilId;
      bricksInvalidation.yearId = academicYearId;
      return { ok: true, data: { awardId: award.id } };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return {
          ok: false,
          code: MUTATION_ERROR_CODES.CONFLICT,
          message: "common.errors.conflict",
        };
      }
      throw error;
    }
  });

  if (result.ok && bricksInvalidation.pupilId && bricksInvalidation.yearId) {
    revalidateBricksCaches(bricksInvalidation.pupilId, bricksInvalidation.yearId);
  }
  return result;
}
