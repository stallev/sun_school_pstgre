import "server-only";
import { ACCOUNT_STATUS, USER_ROLE } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { formatDisplayName } from "@/lib/person/format-display-name";

export type TeacherCandidate = {
  userId: string;
  displayName: string;
};

export async function loadTeacherCandidates(db: PrismaClient): Promise<TeacherCandidate[]> {
  const users = await db.appUser.findMany({
    where: {
      status: ACCOUNT_STATUS.ACTIVE,
      roles: { some: { role: USER_ROLE.TEACHER } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, lastName: true, firstName: true, middleName: true },
  });

  return users.map((user) => ({
    userId: user.id,
    displayName: formatDisplayName(user),
  }));
}
