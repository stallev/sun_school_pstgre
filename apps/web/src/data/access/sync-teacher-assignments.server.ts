import "server-only";
import { USER_ROLE } from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import { loadActiveAcademicYearId } from "./active-academic-year.server";

type Tx = Prisma.TransactionClient;

/** Sync `teacher_assignment` for the active year (access_requests §5.6, Q-02). */
export async function syncTeacherAssignmentsForActiveYear(
  tx: Tx,
  userId: string,
  organizationId: string,
  roles: readonly string[],
  gradeIds: readonly string[],
): Promise<void> {
  const academicYearId = await loadActiveAcademicYearId(tx, organizationId);
  if (!academicYearId) return;

  const isTeacher = roles.includes(USER_ROLE.TEACHER);
  if (!isTeacher) {
    await tx.teacherAssignment.deleteMany({ where: { userId, academicYearId } });
    return;
  }

  const desiredGradeIds = [...new Set(gradeIds)];
  if (desiredGradeIds.length === 0) {
    await tx.teacherAssignment.deleteMany({ where: { userId, academicYearId } });
    return;
  }

  await tx.teacherAssignment.deleteMany({
    where: { userId, academicYearId, gradeId: { notIn: desiredGradeIds } },
  });

  for (const gradeId of desiredGradeIds) {
    await tx.teacherAssignment.upsert({
      where: { userId_gradeId_academicYearId: { userId, gradeId, academicYearId } },
      create: { userId, gradeId, academicYearId },
      update: {},
    });
  }
}

export async function replaceUserRoles(tx: Tx, userId: string, roles: readonly string[]): Promise<void> {
  await tx.userRoleAssignment.deleteMany({ where: { userId } });
  for (const role of roles) {
    await tx.userRoleAssignment.create({ data: { userId, role: role as "ADMIN" | "TEACHER" | "PARENT" } });
  }
}
