import "server-only";
import {
  ACADEMIC_YEAR_STATUS,
  ACCOUNT_STATUS,
  APP_LOCALE,
  BIBLE_TRANSLATION_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
  type MutationErr,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

export async function loadGradeInOrganization(
  tx: Tx,
  gradeId: string,
  organizationId: string,
): Promise<{ id: string; name: string; isActive: boolean; language: string } | MutationErr> {
  const grade = await tx.grade.findFirst({
    where: { id: gradeId, organizationId },
    select: { id: true, name: true, isActive: true, language: true },
  });
  if (!grade) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return grade;
}

export async function resolveAcademicYearForNewGroupSettings(
  tx: Tx,
  organizationId: string,
): Promise<{ id: string; status: string } | null> {
  const active = await tx.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true, status: true },
  });
  if (active) return active;
  return tx.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.DRAFT },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true },
  });
}

export async function loadAcademicYearInOrganization(
  tx: Tx,
  yearId: string,
  organizationId: string,
): Promise<{ id: string; status: string } | MutationErr> {
  const year = await tx.academicYear.findFirst({
    where: { id: yearId, organizationId },
    select: { id: true, status: true },
  });
  if (!year) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return year;
}

export const assertYearNotClosed = (yearStatus: string): MutationErr | null => {
  if (yearStatus === ACADEMIC_YEAR_STATUS.CLOSED) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.year_closed" };
  }
  return null;
};

export async function assertActiveGroupNameAvailable(
  tx: Tx,
  organizationId: string,
  name: string,
  exceptGradeId?: string,
): Promise<MutationErr | null> {
  const duplicate = await tx.grade.findFirst({
    where: {
      organizationId,
      isActive: true,
      name,
      ...(exceptGradeId ? { id: { not: exceptGradeId } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.group.name_taken",
      fields: { name: "admin.group.name_taken" },
    };
  }
  return null;
}

export async function isEnglishBibleReady(tx: Tx): Promise<boolean> {
  const row = await tx.bibleTranslation.findFirst({
    where: { locale: APP_LOCALE.EN, status: BIBLE_TRANSLATION_STATUS.READY },
    select: { id: true },
  });
  return row !== null;
}

export async function assertUserIsActiveTeacher(
  tx: Tx,
  userId: string,
  organizationId: string,
): Promise<MutationErr | null> {
  const user = await tx.appUser.findFirst({
    where: { id: userId, organizationId },
    select: { status: true, roles: { select: { role: true } } },
  });
  if (!user || user.status !== ACCOUNT_STATUS.ACTIVE) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  const isTeacher = user.roles.some((row) => row.role === USER_ROLE.TEACHER);
  if (!isTeacher) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_NOT_A_TEACHER,
      message: "admin.group.not_teacher",
    };
  }
  return null;
}
