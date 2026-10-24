import "server-only";

import {
  ACADEMIC_YEAR_STATUS,
  GROUP_ACHIEVEMENT_PENALTY_TIER,
  USER_ROLE,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import {
  assertSetGroupAchievementPointsAccess,
} from "@/data/achievements/achievement-mutate-access.server";
import { readFeaturesAchievementsEnabled } from "@/data/achievements/achievement-feature.server";
import { loadAchievementsCatalogPage } from "@/data/achievements/load-achievements-catalog-page.server";
import {
  getGroupPointsOverride,
  globalCatalogPenaltyPoints,
  loadGroupAchievementPointsOverrides,
} from "@/data/achievements/group-achievement-points.server";
import { listGroupYearTotals } from "@/data/analytics/years/list-group-year-totals";
import { loadTeacherGroupPage } from "@/data/school/load-teacher-group-page.server";
import { isMutationErr } from "../access/access-admin-guards.server";
import { PRACTICE_ACHIEVEMENT_CODE, type CatalogRowDto } from "@/lib/achievements/catalog-display";

export type GroupPointsYearOption = { id: string; name: string };

export type GroupPointsTableRowDto = {
  rowKey: string;
  achievementId: string;
  tier: number;
  achievementName: string;
  tierLabel: string;
  conditionLabel: string;
  globalPoints: number;
  overridePoints: number | null;
  isPenalty: boolean;
  readOnly: boolean;
};

export type GroupPointsEditorData = {
  gradeId: string;
  gradeName: string;
  academicYearId: string;
  yearName: string;
  yearClosed: boolean;
  canMutate: boolean;
  rows: GroupPointsTableRowDto[];
  copySourceGrades: { id: string; name: string }[];
  yearOptions: GroupPointsYearOption[];
};

export type GroupPointsPageData =
  | { kind: "flag_off" }
  | { kind: "not_found" }
  | { kind: "no_active_year" }
  | { kind: "unassigned" }
  | { kind: "empty_catalog" }
  | { kind: "editor"; data: GroupPointsEditorData };

function rowKey(achievementId: string, tier: number): string {
  return `${achievementId}:${tier}`;
}

function buildTableRows(
  catalog: { rewards: CatalogRowDto[]; penalties: CatalogRowDto[] },
  overrides: Map<string, number>,
  tierLabels: [string, string, string],
): GroupPointsTableRowDto[] {
  const rows: GroupPointsTableRowDto[] = [];

  for (const reward of catalog.rewards) {
    const readOnly = reward.code === PRACTICE_ACHIEVEMENT_CODE && !reward.isActive;
    for (const tier of reward.tiers) {
      if (tier.tier < 1 || tier.tier > 3) continue;
      const override = getGroupPointsOverride(overrides, reward.id, tier.tier);
      rows.push({
        rowKey: rowKey(reward.id, tier.tier),
        achievementId: reward.id,
        tier: tier.tier,
        achievementName: reward.nameRu,
        tierLabel: reward.tiers.length > 1 ? (tierLabels[tier.tier - 1] ?? "—") : "—",
        conditionLabel: `${tier.length}`,
        globalPoints: tier.points,
        overridePoints: override === undefined ? null : override,
        isPenalty: false,
        readOnly,
      });
    }
  }

  for (const penalty of catalog.penalties) {
    const global = globalCatalogPenaltyPoints(
      penalty.threshold,
      penalty.tiers.find((t) => t.tier === GROUP_ACHIEVEMENT_PENALTY_TIER)?.points,
    );
    if (global === null) continue;
    const override = getGroupPointsOverride(overrides, penalty.id, GROUP_ACHIEVEMENT_PENALTY_TIER);
    rows.push({
      rowKey: rowKey(penalty.id, GROUP_ACHIEVEMENT_PENALTY_TIER),
      achievementId: penalty.id,
      tier: GROUP_ACHIEVEMENT_PENALTY_TIER,
      achievementName: penalty.nameRu,
      tierLabel: "—",
      conditionLabel: penalty.descriptionRu ?? penalty.nameRu,
      globalPoints: global,
      overridePoints: override === undefined ? null : override,
      isPenalty: true,
      readOnly: false,
    });
  }

  return rows;
}

async function loadCopySourceGrades(
  db: PrismaClient,
  actorUserId: string,
  role: typeof USER_ROLE.ADMIN | typeof USER_ROLE.TEACHER,
  organizationId: string,
  academicYearId: string,
  excludeGradeId: string,
): Promise<{ id: string; name: string }[]> {
  const grades = await db.grade.findMany({
    where: { organizationId, id: { not: excludeGradeId } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  if (role === USER_ROLE.ADMIN) return grades;

  const assigned = await db.teacherAssignment.findMany({
    where: { userId: actorUserId, academicYearId },
    select: { gradeId: true },
  });
  const allowed = new Set(assigned.map((row) => row.gradeId));
  return grades.filter((grade) => allowed.has(grade.id));
}

async function loadEditorForGradeYear(
  db: PrismaClient,
  actorUserId: string,
  role: typeof USER_ROLE.ADMIN | typeof USER_ROLE.TEACHER,
  gradeId: string,
  gradeName: string,
  academicYearId: string,
  yearName: string,
  yearStatus: string,
  yearOptions: GroupPointsYearOption[],
  tierLabels: [string, string, string],
): Promise<GroupPointsPageData> {
  const organizationId = await getDefaultOrganizationId(db);
  const access = await db.$transaction((tx) =>
    assertSetGroupAchievementPointsAccess(
      tx,
      actorUserId,
      organizationId,
      gradeId,
      academicYearId,
      yearStatus,
    ),
  );
  if (access) {
    return { kind: "not_found" };
  }

  const catalog = await loadAchievementsCatalogPage(db);
  if (catalog.rewards.length === 0 && catalog.penalties.length === 0) {
    return { kind: "empty_catalog" };
  }

  const overrides = await db.$transaction((tx) =>
    loadGroupAchievementPointsOverrides(tx, gradeId, academicYearId),
  );

  const yearClosed = yearStatus !== ACADEMIC_YEAR_STATUS.ACTIVE;
  const canMutate = role === USER_ROLE.ADMIN ? true : !yearClosed;

  const copySourceGrades = await loadCopySourceGrades(
    db,
    actorUserId,
    role,
    organizationId,
    academicYearId,
    gradeId,
  );

  return {
    kind: "editor",
    data: {
      gradeId,
      gradeName,
      academicYearId,
      yearName,
      yearClosed,
      canMutate,
      yearOptions,
      copySourceGrades,
      rows: buildTableRows(catalog, overrides, tierLabels),
    },
  };
}

export async function loadTeacherGroupPointsPage(
  db: PrismaClient,
  teacherUserId: string,
  yearParam?: string,
  tierLabels: [string, string, string] = ["", "", ""],
): Promise<GroupPointsPageData> {
  const flagOn = await db.$transaction((tx) => readFeaturesAchievementsEnabled(tx));
  if (!flagOn) return { kind: "flag_off" };

  const base = await loadTeacherGroupPage(db, teacherUserId);
  if (base.kind === "no_active_year") return { kind: "no_active_year" };
  if (base.kind === "unassigned") return { kind: "unassigned" };

  const totalsResult = await listGroupYearTotals(db, teacherUserId, base.gradeId, yearParam);
  if (isMutationErr(totalsResult)) {
    return { kind: "not_found" };
  }

  const selected = totalsResult.data.rows.find(
    (row) => row.yearId === totalsResult.data.selectedYearId,
  );
  if (!selected) return { kind: "not_found" };

  const yearOptions = totalsResult.data.rows.map((row) => ({
    id: row.yearId,
    name: row.yearName,
  }));

  return loadEditorForGradeYear(
    db,
    teacherUserId,
    USER_ROLE.TEACHER,
    base.gradeId,
    base.gradeName,
    totalsResult.data.selectedYearId,
    selected.yearName,
    selected.status,
    yearOptions,
    tierLabels,
  );
}

export async function loadAdminGroupPointsPage(
  db: PrismaClient,
  adminUserId: string,
  gradeId: string,
  yearParam?: string,
  tierLabels: [string, string, string] = ["", "", ""],
): Promise<GroupPointsPageData> {
  const flagOn = await db.$transaction((tx) => readFeaturesAchievementsEnabled(tx));
  if (!flagOn) return { kind: "flag_off" };

  const organizationId = await getDefaultOrganizationId(db);
  const grade = await db.grade.findFirst({
    where: { id: gradeId, organizationId },
    select: { id: true, name: true },
  });
  if (!grade) return { kind: "not_found" };

  const years = await db.academicYear.findMany({
    where: { organizationId },
    orderBy: [{ startsOn: "desc" }],
    select: { id: true, name: true, status: true },
  });
  if (years.length === 0) return { kind: "not_found" };

  const selectedYear =
    years.find((year) => year.id === yearParam) ??
    years.find((year) => year.status === ACADEMIC_YEAR_STATUS.ACTIVE) ??
    years[0]!;

  const yearOptions = years.map((year) => ({ id: year.id, name: year.name }));

  return loadEditorForGradeYear(
    db,
    adminUserId,
    USER_ROLE.ADMIN,
    grade.id,
    grade.name,
    selectedYear.id,
    selectedYear.name,
    selectedYear.status,
    yearOptions,
    tierLabels,
  );
}
