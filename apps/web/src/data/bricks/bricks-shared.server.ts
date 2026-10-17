import "server-only";

import {
  AUDIT_ACTION,
  computeBalance,
  MUTATION_ERROR_CODES,
  type BricksBalanceSnapshot,
  type MutationErr,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import { isMutationErr, userHasAdminRole } from "../access/access-admin-guards.server";
import { calendarDateFromIso, isoFromCalendarDate } from "../school/calendar-date";
import {
  loadActorOrganizationId,
  loadPupilInOrganization,
  lockPupilRow,
} from "../school/school-pupil-shared.server";
import { loadAcademicYearForOrganization } from "../school/school-year-guards.server";

type Tx = Prisma.TransactionClient;

export type BrickLedgerEntryDto = {
  id: string;
  quantity: number;
  issuedOn: string;
  note: string | null;
  createdAt: string;
};

export async function loadBricksEarnedAndIssued(
  tx: Tx,
  pupilId: string,
  yearId: string,
): Promise<{ earned: number; issued: number }> {
  const [earnedRow, issuedRow] = await Promise.all([
    tx.homeworkCheck.aggregate({
      where: {
        pupilId,
        homeworkChecked: true,
        pointsTotal: { not: null },
        lesson: { academicYearId: yearId },
      },
      _sum: { pointsTotal: true },
    }),
    tx.brickLedger.aggregate({
      where: { pupilId, academicYearId: yearId },
      _sum: { quantity: true },
    }),
  ]);
  return {
    earned: earnedRow._sum.pointsTotal ?? 0,
    issued: issuedRow._sum.quantity ?? 0,
  };
}

export async function loadBricksBalanceInTransaction(
  tx: Tx,
  pupilId: string,
  yearId: string,
): Promise<BricksBalanceSnapshot> {
  const totals = await loadBricksEarnedAndIssued(tx, pupilId, yearId);
  return computeBalance(totals.earned, totals.issued);
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
  const enrollments = await tx.enrollment.findMany({
    where: { pupilId, academicYearId: yearId },
    select: { gradeId: true },
  });
  if (enrollments.length === 0) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const assignment = await tx.teacherAssignment.findFirst({
    where: {
      userId: actorUserId,
      academicYearId: yearId,
      gradeId: { in: enrollments.map((row) => row.gradeId) },
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
}): BrickLedgerEntryDto => ({
  id: row.id,
  quantity: row.quantity,
  issuedOn: isoFromCalendarDate(row.issuedOn),
  note: row.note,
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
