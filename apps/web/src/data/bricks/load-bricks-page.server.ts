import "server-only";

import { ACADEMIC_YEAR_STATUS, buildBricksBalanceSnapshot } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { userHasAdminRole } from "@/data/access/access-admin-guards.server";
import type { LessonsListGradeOption } from "@/data/lessons/load-lessons-list-page.server";
import { assertTeacherAssignedToGradeInYear } from "@/data/school/school-enrollment-shared.server";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { readFeaturesAchievementsEnabled } from "../achievements/achievement-feature.server";
import { loadBricksBalanceComponentsForPupils } from "./bricks-shared.server";
import { listLedger } from "./list-ledger";
import type { BrickLedgerEntryDto } from "./bricks-shared.server";

export type BricksBalanceRow = {
  pupilId: string;
  displayName: string;
  earned: number;
  issued: number;
  balance: number;
  needsAttention: boolean;
  achievementBonus: number;
  penaltiesTotal: number;
  achievementsUiEnabled: boolean;
};

export type BricksPageData =
  | { kind: "no_active_year" }
  | { kind: "unassigned" }
  | {
      kind: "page";
      yearId: string;
      yearName: string;
      yearClosed: boolean;
      gradeId: string;
      gradeName: string;
      grades: LessonsListGradeOption[];
      isAdmin: boolean;
      rows: BricksBalanceRow[];
      selectedPupilId: string | null;
      ledger: BrickLedgerEntryDto[];
    };

async function loadGradeOptions(
  db: PrismaClient,
  actorUserId: string,
  yearId: string,
  organizationId: string,
  isAdmin: boolean,
): Promise<LessonsListGradeOption[]> {
  if (isAdmin) {
    const rows = await db.grade.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return rows.map((row) => ({ gradeId: row.id, name: row.name }));
  }
  const assignments = await db.teacherAssignment.findMany({
    where: { userId: actorUserId, academicYearId: yearId },
    select: { grade: { select: { id: true, name: true } } },
    orderBy: { grade: { name: "asc" } },
  });
  return assignments.map((row) => ({ gradeId: row.grade.id, name: row.grade.name }));
}

export async function loadBricksPage(
  db: PrismaClient,
  actorUserId: string,
  preferredGradeId: string | null,
  preferredPupilId: string | null,
): Promise<BricksPageData> {
  const organizationId = await getDefaultOrganizationId(db);
  const [isAdmin, year] = await Promise.all([
    userHasAdminRole(db, actorUserId),
    db.academicYear.findFirst({
      where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
      select: { id: true, name: true, status: true },
    }),
  ]);
  if (!year) return { kind: "no_active_year" };

  const grades = await loadGradeOptions(db, actorUserId, year.id, organizationId, isAdmin);
  if (grades.length === 0) return { kind: "unassigned" };

  const gradeId =
    preferredGradeId && grades.some((g) => g.gradeId === preferredGradeId)
      ? preferredGradeId
      : grades[0]?.gradeId;
  if (!gradeId) return { kind: "unassigned" };

  if (!isAdmin) {
    const scope = await assertTeacherAssignedToGradeInYear(db, actorUserId, gradeId, year.id);
    if (scope) return { kind: "unassigned" };
  }

  const enrollments = await db.enrollment.findMany({
    where: { gradeId, academicYearId: year.id, endsOn: null },
    orderBy: [{ pupil: { lastName: "asc" } }, { pupil: { firstName: "asc" } }],
    select: {
      pupil: {
        select: { id: true, lastName: true, firstName: true, middleName: true },
      },
    },
  });

  const pupilIds = enrollments.map((row) => row.pupil.id);
  const achievementsUiEnabled = await readFeaturesAchievementsEnabled(db);
  const componentsByPupil = await loadBricksBalanceComponentsForPupils(db, pupilIds, year.id);

  const rows: BricksBalanceRow[] = enrollments.map((row) => {
    const components = componentsByPupil.get(row.pupil.id) ?? {
      checkPoints: 0,
      achievementBonus: 0,
      penaltiesTotal: 0,
      issued: 0,
    };
    const snapshot = buildBricksBalanceSnapshot(components, achievementsUiEnabled);
    return {
      pupilId: row.pupil.id,
      displayName: formatDisplayName(row.pupil),
      earned: snapshot.earned,
      issued: snapshot.issued,
      balance: snapshot.balance,
      needsAttention: snapshot.needsAttention,
      achievementBonus: snapshot.achievementBonus,
      penaltiesTotal: snapshot.penaltiesTotal,
      achievementsUiEnabled,
    };
  });

  const selectedPupilId =
    preferredPupilId && rows.some((r) => r.pupilId === preferredPupilId) ? preferredPupilId : null;

  let ledger: BrickLedgerEntryDto[] = [];
  if (selectedPupilId) {
    const ledgerResult = await listLedger(db, actorUserId, selectedPupilId, year.id);
    if (ledgerResult.ok) ledger = ledgerResult.data;
  }

  const gradeName = grades.find((g) => g.gradeId === gradeId)?.name ?? "";

  return {
    kind: "page",
    yearId: year.id,
    yearName: year.name,
    yearClosed: year.status !== ACADEMIC_YEAR_STATUS.ACTIVE,
    gradeId,
    gradeName,
    grades,
    isAdmin,
    rows,
    selectedPupilId,
    ledger,
  };
}
