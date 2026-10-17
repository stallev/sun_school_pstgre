import "server-only";
import {
  ACADEMIC_YEAR_STATUS,
  MUTATION_ERROR_CODES,
  type AcademicYearStatus,
  type MutationErr,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

export async function lockOrganizationAcademicYears(tx: Tx, organizationId: string): Promise<void> {
  await tx.$queryRaw`
    SELECT id FROM academic_year WHERE organization_id = ${organizationId}::uuid FOR UPDATE
  `;
}

export async function lockAcademicYearRow(tx: Tx, yearId: string): Promise<boolean> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM academic_year WHERE id = ${yearId}::uuid FOR UPDATE
  `;
  return rows.length > 0;
}

export async function loadAcademicYearForOrganization(
  tx: Tx,
  yearId: string,
  organizationId: string,
): Promise<
  | { id: string; status: AcademicYearStatus; startsOn: Date; endsOn: Date; organizationId: string }
  | MutationErr
> {
  const year = await tx.academicYear.findFirst({
    where: { id: yearId, organizationId },
    select: { id: true, status: true, startsOn: true, endsOn: true, organizationId: true },
  });
  if (!year) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return year;
}

export async function organizationHasActiveYear(tx: Tx, organizationId: string, exceptYearId?: string): Promise<boolean> {
  const active = await tx.academicYear.findFirst({
    where: {
      organizationId,
      status: ACADEMIC_YEAR_STATUS.ACTIVE,
      ...(exceptYearId ? { id: { not: exceptYearId } } : {}),
    },
    select: { id: true },
  });
  return active !== null;
}
