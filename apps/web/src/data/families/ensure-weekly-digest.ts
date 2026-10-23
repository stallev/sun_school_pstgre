import "server-only";

import {
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  emptyWeeklyDigestPayload,
  getCalendarDateInTimeZone,
  getCalendarWeekPeriodEnd,
  getCalendarWeekPeriodStart,
  MUTATION_ERROR_CODES,
  PENALTY_STATUS,
  type MutationResult,
  type WeeklyDigestPayload,
  USER_ROLE,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { assertParentsFeatureOn } from "./family-mutate-access.server";

type Tx = Prisma.TransactionClient;

const APP_SETTING_SCHOOL_TIMEZONE_KEY = "school_timezone";
const DEFAULT_SCHOOL_TIMEZONE = "Europe/Moscow";
const UNIQUE_VIOLATION = "P2002";

export type WeeklyDigestRow = {
  digestId: string;
  periodStart: string;
  payload: WeeklyDigestPayload;
  sentAt: null;
};

async function loadSchoolTimeZone(tx: Tx): Promise<string> {
  const row = await tx.appSetting.findUnique({
    where: { key: APP_SETTING_SCHOOL_TIMEZONE_KEY },
    select: { value: true },
  });
  const value = row?.value;
  return typeof value === "string" && value.length > 0 ? value : DEFAULT_SCHOOL_TIMEZONE;
}

async function loadParentPupilIds(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
): Promise<string[]> {
  const adults = await tx.familyAdult.findMany({
    where: { userId: actorUserId },
    select: { familyId: true },
  });
  if (adults.length === 0) return [];

  const pupils = await tx.pupil.findMany({
    where: {
      organizationId,
      familyId: { in: adults.map((row) => row.familyId) },
    },
    select: { id: true },
  });
  return pupils.map((row) => row.id);
}

async function buildWeeklyDigestPayload(
  tx: Tx,
  pupilIds: string[],
  periodStart: string,
  periodEnd: string,
  schoolTimeZone: string,
): Promise<WeeklyDigestPayload> {
  if (pupilIds.length === 0) return emptyWeeklyDigestPayload();

  const periodStartDate = new Date(`${periodStart}T00:00:00.000Z`);
  const periodEndDate = new Date(`${periodEnd}T00:00:00.000Z`);

  const [awards, penalties, lateChecks] = await Promise.all([
    tx.achievementAward.findMany({
      where: { pupilId: { in: pupilIds } },
      select: { id: true, awardedAt: true },
    }),
    tx.penalty.findMany({
      where: {
        pupilId: { in: pupilIds },
        status: PENALTY_STATUS.ACTIVE,
      },
      select: { id: true, createdAt: true },
    }),
    tx.homeworkCheck.findMany({
      where: {
        pupilId: { in: pupilIds },
        late: true,
        lesson: {
          lessonDate: { gte: periodStartDate, lte: periodEndDate },
        },
      },
      select: { id: true },
    }),
  ]);

  const inWeek = (instant: Date): boolean => {
    const day = getCalendarDateInTimeZone(instant, schoolTimeZone);
    return day >= periodStart && day <= periodEnd;
  };

  return {
    awardIds: awards.filter((row) => inWeek(row.awardedAt)).map((row) => row.id),
    penaltyIds: penalties.filter((row) => inWeek(row.createdAt)).map((row) => row.id),
    lateCheckIds: lateChecks.map((row) => row.id),
  };
}

function toDigestRow(row: {
  id: string;
  periodStart: Date;
  payload: unknown;
  sentAt: Date | null;
}): WeeklyDigestRow {
  const payload = row.payload as WeeklyDigestPayload;
  return {
    digestId: row.id,
    periodStart: row.periodStart.toISOString().slice(0, 10),
    payload,
    sentAt: null,
  };
}

async function findDigestRow(
  tx: Tx,
  userId: string,
  periodStartDate: Date,
): Promise<WeeklyDigestRow | null> {
  const existing = await tx.weeklyDigest.findFirst({
    where: { userId, periodStart: periodStartDate },
    select: { id: true, periodStart: true, payload: true, sentAt: true },
  });
  return existing ? toDigestRow(existing) : null;
}

export async function ensureWeeklyDigestInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  now: Date,
): Promise<MutationResult<WeeklyDigestRow>> {
  const flagError = await assertParentsFeatureOn(tx);
  if (flagError) return flagError;

  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: { status: true, roles: { select: { role: true } } },
  });
  const isParent =
    user?.status === ACCOUNT_STATUS.ACTIVE &&
    user.roles.some((row) => row.role === USER_ROLE.PARENT);
  if (!isParent) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.forbidden" };
  }

  const schoolTimeZone = await loadSchoolTimeZone(tx);
  const periodStartIso = getCalendarWeekPeriodStart(now, schoolTimeZone);
  const periodEndIso = getCalendarWeekPeriodEnd(periodStartIso);
  const periodStartDate = new Date(`${periodStartIso}T00:00:00.000Z`);

  const existing = await findDigestRow(tx, actorUserId, periodStartDate);
  if (existing) return { ok: true, data: existing };

  const pupilIds = await loadParentPupilIds(tx, actorUserId, organizationId);
  const payload = await buildWeeklyDigestPayload(
    tx,
    pupilIds,
    periodStartIso,
    periodEndIso,
    schoolTimeZone,
  );

  try {
    const created = await tx.weeklyDigest.create({
      data: {
        userId: actorUserId,
        periodStart: periodStartDate,
        payload,
        sentAt: null,
      },
      select: { id: true, periodStart: true, payload: true, sentAt: true },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.SYSTEM,
      entityType: AUDIT_ENTITY_TYPE.WEEKLY_DIGEST,
      entityId: created.id,
      action: AUDIT_ACTION.DIGEST_RECORDED,
      newValue: { digestId: created.id, periodStart: periodStartIso },
    });

    return { ok: true, data: toDigestRow(created) };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === UNIQUE_VIOLATION
    ) {
      const raced = await findDigestRow(tx, actorUserId, periodStartDate);
      if (raced) return { ok: true, data: raced };
    }
    throw error;
  }
}

export async function ensureWeeklyDigest(
  db: PrismaClient,
  actorUserId: string,
  now: Date = new Date(),
): Promise<MutationResult<WeeklyDigestRow>> {
  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return ensureWeeklyDigestInTransaction(tx, actorUserId, organizationId, now);
  });
}
