import "server-only";

import {
  ACADEMIC_YEAR_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
  type MutationErr,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr, userHasAdminRole } from "@/data/access/access-admin-guards.server";
import { assertTeacherAssignedToGradeInYear } from "@/data/school/school-enrollment-shared.server";
import { loadAcademicYearForOrganization } from "@/data/school/school-year-guards.server";

export async function assertLessonReadAccess(
  db: PrismaClient,
  actorUserId: string,
  organizationId: string,
  lesson: { gradeId: string; academicYearId: string },
): Promise<{ mode: "admin" | "teacher"; canMutate: boolean; yearClosed: boolean } | MutationErr> {
  const isAdmin = await userHasAdminRole(db, actorUserId);
  const year = await loadAcademicYearForOrganization(db, lesson.academicYearId, organizationId);
  if (isMutationErr(year)) return year;
  const yearClosed = year.status !== ACADEMIC_YEAR_STATUS.ACTIVE;

  if (isAdmin) {
    return { mode: "admin", canMutate: !yearClosed, yearClosed };
  }

  const user = await db.appUser.findFirst({
    where: { id: actorUserId, organizationId },
    select: { roles: { select: { role: true } } },
  });
  const isTeacher = user?.roles.some((row) => row.role === USER_ROLE.TEACHER) ?? false;
  if (!isTeacher) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const scope = await assertTeacherAssignedToGradeInYear(
    db,
    actorUserId,
    lesson.gradeId,
    lesson.academicYearId,
  );
  if (scope) return scope;

  return { mode: "teacher", canMutate: !yearClosed, yearClosed };
}
