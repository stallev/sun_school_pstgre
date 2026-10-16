import "server-only";
import { ACADEMIC_YEAR_STATUS, MUTATION_ERROR_CODES, type MutationErr } from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

export async function loadActiveAcademicYearId(tx: Tx, organizationId: string): Promise<string | null> {
  const year = await tx.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true },
  });
  return year?.id ?? null;
}

/** Validates `gradeIds` belong to the active academic year (access_requests §6). */
export async function validateGradeIdsForActiveYear(
  tx: Tx,
  organizationId: string,
  gradeIds: readonly string[],
): Promise<MutationErr | null> {
  if (gradeIds.length === 0) return null;

  const academicYearId = await loadActiveAcademicYearId(tx, organizationId);
  if (!academicYearId) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.approvals.groups_invalid",
      fields: { gradeIds: "admin.approvals.groups_invalid" },
    };
  }

  const matchCount = await tx.gradeSettings.count({
    where: {
      academicYearId,
      gradeId: { in: [...gradeIds] },
      grade: { organizationId },
    },
  });

  if (matchCount !== gradeIds.length) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.approvals.groups_invalid",
      fields: { gradeIds: "admin.approvals.groups_invalid" },
    };
  }

  return null;
}
