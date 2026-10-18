import "server-only";

import {
  ACADEMIC_YEAR_STATUS,
  computeRatingMetric,
  MUTATION_ERROR_CODES,
  rankRatingRows,
} from "@sunschool/domain";
import { formatDisplayName } from "@/lib/person/format-display-name";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { isMutationErr, userHasAdminRole } from "@/data/access/access-admin-guards.server";
import type { LessonsListGradeOption } from "@/data/lessons/load-lessons-list-page.server";
import { assertTeacherAssignedToGradeInYear } from "@/data/school/school-enrollment-shared.server";
import { getGroupRating, type RatingTableRow } from "./get-group-rating";

export type RatingPageScope = "group" | "school";

export type RatingPageData =
  | { kind: "no_active_year" }
  | { kind: "unassigned" }
  | { kind: "not_found" }
  | {
      kind: "page";
      yearId: string;
      yearName: string;
      gradeId: string;
      gradeName: string;
      grades: LessonsListGradeOption[];
      isAdmin: boolean;
      scope: RatingPageScope;
      rows: RatingTableRow[];
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

async function loadSchoolRatingRows(
  db: PrismaClient,
  organizationId: string,
  yearId: string,
): Promise<RatingTableRow[]> {
  const enrollments = await db.enrollment.findMany({
    where: { academicYearId: yearId, endsOn: null, pupil: { organizationId } },
    select: {
      pupil: {
        select: { id: true, lastName: true, firstName: true, middleName: true },
      },
    },
  });

  const aggregates = await db.homeworkCheck.groupBy({
    by: ["pupilId"],
    where: {
      homeworkChecked: true,
      pointsTotal: { not: null },
      lesson: { academicYearId: yearId, grade: { organizationId } },
    },
    _sum: { pointsTotal: true },
  });

  const pointsByPupil = new Map(
    aggregates.map((row) => [row.pupilId, row._sum.pointsTotal ?? 0]),
  );

  const ranked = rankRatingRows(
    enrollments.map((row) => ({
      pupilId: row.pupil.id,
      metric: computeRatingMetric(
        pointsByPupil.has(row.pupil.id) ? [pointsByPupil.get(row.pupil.id)!] : [],
      ),
    })),
  );

  const nameById = new Map(
    enrollments.map((row) => [row.pupil.id, formatDisplayName(row.pupil)]),
  );

  return ranked.map((row, index) => ({
    pupilId: row.pupilId,
    displayName: nameById.get(row.pupilId) ?? "",
    metric: row.metric,
    place: index + 1,
  }));
}

export async function loadRatingPage(
  db: PrismaClient,
  actorUserId: string,
  params: { gradeId?: string; scope?: string },
): Promise<RatingPageData> {
  const organizationId = await getDefaultOrganizationId(db);
  const isAdmin = await userHasAdminRole(db, actorUserId);
  const year = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true, name: true },
  });
  if (!year) return { kind: "no_active_year" };

  const grades = await loadGradeOptions(db, actorUserId, year.id, organizationId, isAdmin);
  if (grades.length === 0) return { kind: "unassigned" };

  const scope: RatingPageScope =
    isAdmin && params.scope === "school" ? "school" : "group";

  const preferredGradeId = params.gradeId ?? null;
  const gradeId =
    preferredGradeId && grades.some((g) => g.gradeId === preferredGradeId)
      ? preferredGradeId
      : grades[0]?.gradeId;
  if (!gradeId) return { kind: "unassigned" };

  if (!isAdmin) {
    const denied = await assertTeacherAssignedToGradeInYear(db, actorUserId, gradeId, year.id);
    if (denied) return { kind: "unassigned" };
  }

  if (preferredGradeId && preferredGradeId !== gradeId) {
    return { kind: "not_found" };
  }

  let rows: RatingTableRow[];
  if (scope === "school" && isAdmin) {
    rows = await loadSchoolRatingRows(db, organizationId, year.id);
  } else {
    const ratingResult = await getGroupRating(db, actorUserId, gradeId, year.id);
    if (isMutationErr(ratingResult)) {
      if (ratingResult.code === MUTATION_ERROR_CODES.NOT_FOUND) {
        return { kind: "not_found" };
      }
      return { kind: "unassigned" };
    }
    rows = ratingResult.data.rows;
  }

  const gradeName =
    scope === "school" && isAdmin
      ? ""
      : grades.find((g) => g.gradeId === gradeId)?.name ?? "";

  return {
    kind: "page",
    yearId: year.id,
    yearName: year.name,
    gradeId,
    gradeName,
    grades,
    isAdmin,
    scope,
    rows,
  };
}
