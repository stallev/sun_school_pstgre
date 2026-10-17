import "server-only";
import type { AcademicYearStatus } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";

export type AcademicYearListRow = {
  yearId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  status: AcademicYearStatus;
};

export async function loadAcademicYearsList(
  db: PrismaClient,
  organizationId: string,
): Promise<AcademicYearListRow[]> {
  const rows = await db.academicYear.findMany({
    where: { organizationId },
    orderBy: [{ startsOn: "desc" }],
    select: {
      id: true,
      name: true,
      startsOn: true,
      endsOn: true,
      status: true,
    },
  });

  return rows.map((row) => ({
    yearId: row.id,
    name: row.name,
    startsOn: row.startsOn.toISOString().slice(0, 10),
    endsOn: row.endsOn.toISOString().slice(0, 10),
    status: row.status as AcademicYearStatus,
  }));
}
