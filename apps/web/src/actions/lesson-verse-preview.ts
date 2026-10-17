"use server";

import { USER_ROLE, type AppLocale, type VerseRangeInput } from "@sunschool/domain";
import { buildVerseTextForRange } from "@/data/bible/get-verse-text";
import { resolveGroupTranslation } from "@/data/bible/get-group-translation";
import { isMutationErr, userHasAdminRole } from "@/data/access/access-admin-guards.server";
import { loadActiveAcademicYearId } from "@/data/access/active-academic-year.server";
import { loadActorOrganizationId } from "@/data/lessons/lesson-shared.server";
import { assertTeacherAssignedToGradeInYear } from "@/data/school/school-enrollment-shared.server";
import { loadGradeInOrganization } from "@/data/school/school-group-shared.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";

export type LessonVersePreviewResult =
  | { ok: true; text: string }
  | { ok: false; reason: "forbidden" | "invalid" | "missing" };

export async function previewLessonVerseAction(
  gradeId: string,
  range: VerseRangeInput,
): Promise<LessonVersePreviewResult> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const db = await getPrisma();
  const organizationId = await loadActorOrganizationId(db, actor.userId);
  if (!organizationId) return { ok: false, reason: "forbidden" };
  const grade = await loadGradeInOrganization(db, gradeId, organizationId);
  if (isMutationErr(grade)) return { ok: false, reason: "forbidden" };

  const isAdmin = await userHasAdminRole(db, actor.userId);
  if (!isAdmin) {
    const yearId = await loadActiveAcademicYearId(db, organizationId);
    if (!yearId) return { ok: false, reason: "forbidden" };
    const scope = await assertTeacherAssignedToGradeInYear(db, actor.userId, gradeId, yearId);
    if (scope) return { ok: false, reason: "forbidden" };
  }

  const translation = await resolveGroupTranslation(grade.language as AppLocale);
  if (!translation.ok) return { ok: false, reason: "missing" };

  const built = await buildVerseTextForRange(translation.code, range);
  if (!built.ok) {
    return built.missing.length > 0 ? { ok: false, reason: "missing" } : { ok: false, reason: "invalid" };
  }
  return { ok: true, text: built.text };
}
