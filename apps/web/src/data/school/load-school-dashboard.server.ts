import "server-only";
import { ACCESS_REQUEST_STATUS, ACADEMIC_YEAR_STATUS } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";

export type SchoolDashboardCounts = {
  groupCount: number;
  pupilCount: number;
  pendingRequests: number;
};

export async function loadSchoolDashboardCounts(db: PrismaClient): Promise<SchoolDashboardCounts> {
  const organizationId = await getDefaultOrganizationId(db);

  const activeYear = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true },
  });

  const [groupCount, pupilCount, pendingRequests] = await Promise.all([
    activeYear
      ? db.gradeSettings.count({
          where: {
            academicYearId: activeYear.id,
            grade: { organizationId, isActive: true },
          },
        })
      : Promise.resolve(0),
    activeYear
      ? db.enrollment.count({
          where: { academicYearId: activeYear.id, endsOn: null, pupil: { organizationId } },
        })
      : Promise.resolve(0),
    db.accessRequest.count({ where: { status: ACCESS_REQUEST_STATUS.PENDING } }),
  ]);

  return { groupCount, pupilCount, pendingRequests };
}
