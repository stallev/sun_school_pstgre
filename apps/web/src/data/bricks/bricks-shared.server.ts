import "server-only";

import {
  AUDIT_ACTION,
  buildBricksBalanceSnapshot,
  MUTATION_ERROR_CODES,
  PENALTY_STATUS,
  type BricksBalanceSnapshot,
  type MutationErr,
} from "@sunschool/domain";
import type { DbReader } from "@sunschool/db";
import { readFeaturesAchievementsEnabled } from "../achievements/achievement-feature.server";
import { isMutationErr, userHasAdminRole } from "../access/access-admin-guards.server";
import { calendarDateFromIso, isoFromCalendarDate } from "../school/calendar-date";
import {
  loadActorOrganizationId,
  loadPupilInOrganization,
  lockPupilRow,
} from "../school/school-pupil-shared.server";
import { loadAcademicYearForOrganization } from "../school/school-year-guards.server";
import { formatDisplayName } from "@/lib/person/format-display-name";

type Tx = DbReader;

export type BrickLedgerEntryDto = {
  id: string;
  quantity: number;
  issuedOn: string;
  note: string | null;
  issuedByName: string;
  createdAt: string;
};

export type BricksBalanceComponentsRow = {
  checkPoints: number;
  achievementBonus: number;
  penaltiesTotal: number;
  issued: number;
};

const emptyBricksBalanceComponents = (): BricksBalanceComponentsRow => ({
  checkPoints: 0,
  achievementBonus: 0,
  penaltiesTotal: 0,
  issued: 0,
});

export async function loadBricksBalanceComponentsForPupils(
  db: DbReader,
  pupilIds: string[],
  yearId: string,
): Promise<Map<string, BricksBalanceComponentsRow>> {
  const result = new Map<string, BricksBalanceComponentsRow>();
  for (const pupilId of pupilIds) {
    result.set(pupilId, emptyBricksBalanceComponents());
  }
  if (pupilIds.length === 0) return result;

  const pupilIdIn = { in: pupilIds };

  const [checkGroups, issuedGroups, bonusGroups, penaltyRows] = await Promise.all([
    db.homeworkCheck.groupBy({
      by: ["pupilId"],
      where: {
        pupilId: pupilIdIn,
        homeworkChecked: true,
        pointsTotal: { not: null },
        lesson: { academicYearId: yearId },
      },
      _sum: { pointsTotal: true },
    }),
    db.brickLedger.groupBy({
      by: ["pupilId"],
      where: { pupilId: pupilIdIn, academicYearId: yearId },
      _sum: { quantity: true },
    }),
    db.achievementAward.groupBy({
      by: ["pupilId"],
      where: { pupilId: pupilIdIn, academicYearId: yearId, revokedAt: null },
      _sum: { points: true },
    }),
    db.penalty.findMany({
      where: {
        pupilId: pupilIdIn,
        status: PENALTY_STATUS.ACTIVE,
        lesson: { academicYearId: yearId },
      },
      select: { pupilId: true, points: true },
    }),
  ]);

  for (const row of checkGroups) {
    const entry = result.get(row.pupilId);
    if (entry) entry.checkPoints = row._sum.pointsTotal ?? 0;
  }
  for (const row of issuedGroups) {
    const entry = result.get(row.pupilId);
    if (entry) entry.issued = row._sum.quantity ?? 0;
  }
  for (const row of bonusGroups) {
    const entry = result.get(row.pupilId);
    if (entry) entry.achievementBonus = row._sum.points ?? 0;
  }
  for (const row of penaltyRows) {
    const entry = result.get(row.pupilId);
    if (entry) entry.penaltiesTotal += Math.abs(row.points);
  }

  return result;
}

export async function loadBricksBalanceComponents(
  db: DbReader,
  pupilId: string,
  yearId: string,
): Promise<BricksBalanceComponentsRow> {
  const map = await loadBricksBalanceComponentsForPupils(db, [pupilId], yearId);
  return map.get(pupilId) ?? emptyBricksBalanceComponents();
}

export async function loadBricksEarnedAndIssued(
  tx: Tx,
  pupilId: string,
  yearId: string,
): Promise<{ earned: number; issued: number }> {
  const components = await loadBricksBalanceComponents(tx, pupilId, yearId);
  return { earned: components.checkPoints, issued: components.issued };
}

export async function loadBricksBalanceInTransaction(
  tx: Tx,
  pupilId: string,
  yearId: string,
  achievementsEnabled?: boolean,
): Promise<BricksBalanceSnapshot> {
  const enabled =
    achievementsEnabled ?? (await readFeaturesAchievementsEnabled(tx as DbReader));
  const components = await loadBricksBalanceComponents(tx, pupilId, yearId);
  return buildBricksBalanceSnapshot(components, enabled);
}

export async function assertBricksReadAccess(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  pupilId: string,
  yearId: string,
): Promise<MutationErr | null> {
  const year = await loadAcademicYearForOrganization(tx, yearId, organizationId);
  if (isMutationErr(year)) return year;

  const pupil = await loadPupilInOrganization(tx, pupilId, organizationId);
  if (isMutationErr(pupil)) return pupil;

  if (await userHasAdminRole(tx, actorUserId)) {
    return null;
  }

  return assertTeacherBricksScope(tx, actorUserId, pupilId, yearId);
}

export async function assertBricksMutateAccess(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  pupilId: string,
  yearId: string,
): Promise<MutationErr | null> {
  return assertBricksReadAccess(tx, actorUserId, organizationId, pupilId, yearId);
}

async function assertTeacherBricksScope(
  tx: Tx,
  actorUserId: string,
  pupilId: string,
  yearId: string,
): Promise<MutationErr | null> {
  const assignment = await tx.teacherAssignment.findFirst({
    where: {
      userId: actorUserId,
      academicYearId: yearId,
      grade: { enrollments: { some: { pupilId, academicYearId: yearId } } },
    },
    select: { id: true },
  });
  if (!assignment) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return null;
}

export async function lockPupilForBricks(
  tx: Tx,
  pupilId: string,
  organizationId: string,
): Promise<MutationErr | null> {
  const locked = await lockPupilRow(tx, pupilId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  const pupil = await loadPupilInOrganization(tx, pupilId, organizationId);
  if (isMutationErr(pupil)) return pupil;
  return null;
}

export async function findIdempotentBrickLedgerId(
  tx: Tx,
  requestId: string,
  action: typeof AUDIT_ACTION.BRICKS_ISSUED | typeof AUDIT_ACTION.BRICKS_COMPENSATED,
): Promise<string | null> {
  const prior = await tx.auditLog.findFirst({
    where: { requestId, action },
    select: { entityId: true },
    orderBy: { occurredAt: "asc" },
  });
  return prior?.entityId ?? null;
}

export const mapBrickLedgerRow = (row: {
  id: string;
  quantity: number;
  issuedOn: Date;
  note: string | null;
  createdAt: Date;
  issuedBy: {
    lastName: string | null;
    firstName: string | null;
    middleName: string | null;
  };
}): BrickLedgerEntryDto => ({
  id: row.id,
  quantity: row.quantity,
  issuedOn: isoFromCalendarDate(row.issuedOn),
  note: row.note,
  issuedByName: formatDisplayName(row.issuedBy),
  createdAt: row.createdAt.toISOString(),
});

export async function loadOrganizationIdForActor(
  tx: Tx,
  actorUserId: string,
): Promise<string | MutationErr> {
  const organizationId = await loadActorOrganizationId(tx, actorUserId);
  if (!organizationId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return organizationId;
}

export const issuedOnDate = (iso: string): Date => calendarDateFromIso(iso);
