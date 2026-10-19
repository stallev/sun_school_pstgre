import "server-only";

import {
  ACADEMIC_YEAR_STATUS,
  USER_ROLE,
  resolveDefaultYear,
  type DefaultYearResult,
} from "@sunschool/domain";
import { isoFromCalendarDate } from "../../school/calendar-date";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "../../access/get-organization-id.server";
import {
  loadGroupYearCatalog,
  loadTeacherAssignedYearIdsForGrade,
  loadActorAnalyticsRole,
  loadVisibleGroupYears,
} from "./year-analytics-access.server";

export async function resolveDefaultYearForGroup(
  db: PrismaClient,
  actorUserId: string,
  gradeId: string,
): Promise<DefaultYearResult> {
  const organizationId = await getDefaultOrganizationId(db);
  return db.$transaction(async (tx) => {
    const visible = await loadVisibleGroupYears(tx, actorUserId, organizationId, gradeId);
    return resolveDefaultYear(visible);
  });
}

export async function resolveDefaultYearForSchool(
  db: PrismaClient,
  actorUserId: string,
): Promise<DefaultYearResult> {
  const organizationId = await getDefaultOrganizationId(db);
  return db.$transaction(async (tx) => {
    const role = await loadActorAnalyticsRole(tx, actorUserId);
    const snapshotYears = await tx.analyticsGroupYearSnapshot.findMany({
      where: { academicYear: { organizationId } },
      select: { academicYear: { select: { id: true, status: true, startsOn: true } } },
      distinct: ["academicYearId"],
    });
    const allYears = snapshotYears.map((row) => ({
      id: row.academicYear.id,
      status: row.academicYear.status,
      startsOn: isoFromCalendarDate(row.academicYear.startsOn),
    }));
    const visible = allYears;
    void role;
    return resolveDefaultYear(visible);
  });
}

export async function loadSchoolYearStrip(
  db: PrismaClient,
  organizationId: string,
): Promise<{ id: string; name: string; status: string; startsOn: string }[]> {
  const rows = await db.analyticsGroupYearSnapshot.findMany({
    where: { academicYear: { organizationId } },
    select: {
      academicYear: { select: { id: true, name: true, status: true, startsOn: true } },
    },
    distinct: ["academicYearId"],
    orderBy: { academicYear: { startsOn: "desc" } },
  });
  const active = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true, name: true, status: true, startsOn: true },
  });
  const byId = new Map<string, { id: string; name: string; status: string; startsOn: string }>();
  for (const row of rows) {
    const year = row.academicYear;
    byId.set(year.id, {
      id: year.id,
      name: year.name,
      status: year.status,
      startsOn: year.startsOn.toISOString().slice(0, 10),
    });
  }
  if (active) {
    byId.set(active.id, {
      id: active.id,
      name: active.name,
      status: active.status,
      startsOn: isoFromCalendarDate(active.startsOn),
    });
  }
  return [...byId.values()].sort((left, right) => right.startsOn.localeCompare(left.startsOn));
}

export async function loadGroupYearCatalogForGrade(
  db: PrismaClient,
  organizationId: string,
  gradeId: string,
  actorUserId: string,
) {
  return db.$transaction(async (tx) => {
    const role = await loadActorAnalyticsRole(tx, actorUserId);
    const catalog = await loadGroupYearCatalog(tx, organizationId, gradeId);
    const teacherAssignedYearIds =
      role === USER_ROLE.TEACHER
        ? await loadTeacherAssignedYearIdsForGrade(tx, actorUserId, gradeId)
        : [];
    return { role, catalog, teacherAssignedYearIds };
  });
}
