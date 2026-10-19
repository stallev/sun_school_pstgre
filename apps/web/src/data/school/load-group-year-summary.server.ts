import "server-only";

import { MUTATION_ERROR_CODES } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import {
  listGroupYearTotals,
  type ListGroupYearTotalsData,
} from "../analytics/years/list-group-year-totals";
import { loadTeacherGroupPage, type TeacherGroupPageData } from "./load-teacher-group-page.server";

export type GroupYearSummaryData =
  | TeacherGroupPageData
  | { kind: "snapshot_missing" }
  | {
      kind: "roster";
      gradeId: string;
      gradeName: string;
      yearClosed: boolean;
      pupils: TeacherGroupPageData extends { kind: "roster"; pupils: infer P } ? P : never;
      addCandidates: TeacherGroupPageData extends { kind: "roster"; addCandidates: infer C }
        ? C
        : never;
      yearTotals: ListGroupYearTotalsData;
    };

export async function loadGroupYearSummaryPage(
  db: PrismaClient,
  teacherUserId: string,
  yearParam?: string,
): Promise<GroupYearSummaryData> {
  const base = await loadTeacherGroupPage(db, teacherUserId);
  if (base.kind !== "roster") return base;

  const totalsResult = await listGroupYearTotals(db, teacherUserId, base.gradeId, yearParam);
  if (isMutationErr(totalsResult)) {
    if (totalsResult.code === MUTATION_ERROR_CODES.ANALYTICS_SNAPSHOT_MISSING) {
      return { kind: "snapshot_missing" };
    }
    return base;
  }

  return {
    kind: "roster",
    gradeId: base.gradeId,
    gradeName: base.gradeName,
    yearClosed: base.yearClosed,
    pupils: base.pupils,
    addCandidates: base.addCandidates,
    yearTotals: totalsResult.data,
  };
}
