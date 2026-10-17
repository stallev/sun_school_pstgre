import "server-only";
import { notFound } from "next/navigation";
import {
  ACCOUNT_STATUS,
  LOGIN_PROVIDER,
  USER_ROLE,
  type AccountStatus,
  type LoginProvider,
  type UserRole,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { loadActiveGrades, type ActiveGradeOption } from "./load-active-grades.server";
import { loadActiveAcademicYearId } from "./active-academic-year.server";

export type UserIdentityView = {
  provider: LoginProvider;
  label: string;
};

export type UserProfileView = {
  userId: string;
  displayName: string;
  lastName: string;
  firstName: string;
  middleName: string;
  status: AccountStatus;
  roles: UserRole[];
  teacherGradeIds: string[];
  identities: UserIdentityView[];
  activeGrades: ActiveGradeOption[];
};

export async function loadUserProfile(db: PrismaClient, userId: string): Promise<UserProfileView> {
  const user = await db.appUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      status: true,
      lastName: true,
      firstName: true,
      middleName: true,
      organizationId: true,
      roles: { select: { role: true } },
      identities: {
        select: { provider: true, email: true },
      },
    },
  });

  if (!user || user.status === ACCOUNT_STATUS.DELETED) {
    notFound();
  }

  const roles = user.roles
    .map((assignment) => assignment.role)
    .filter((role): role is UserRole => role === USER_ROLE.ADMIN || role === USER_ROLE.TEACHER);

  const activeYearId = await loadActiveAcademicYearId(db, user.organizationId);
  let teacherGradeIds: string[] = [];
  if (activeYearId && roles.includes(USER_ROLE.TEACHER)) {
    const assignments = await db.teacherAssignment.findMany({
      where: { userId: user.id, academicYearId: activeYearId },
      select: { gradeId: true },
    });
    teacherGradeIds = assignments.map((row) => row.gradeId);
  }

  const activeGrades = await loadActiveGrades(db, user.organizationId);

  return {
    userId: user.id,
    displayName: formatDisplayName(user),
    lastName: user.lastName ?? "",
    firstName: user.firstName ?? "",
    middleName: user.middleName ?? "",
    status: user.status,
    roles,
    teacherGradeIds,
    identities: user.identities.map((identity) => ({
      provider: identity.provider,
      label: identityLabel(identity),
    })),
    activeGrades,
  };
}

type IdentityRow = {
  provider: string;
  email: string | null;
};

const identityLabel = (identity: IdentityRow): string => {
  if (identity.provider === LOGIN_PROVIDER.CREDENTIALS) {
    return identity.email ?? LOGIN_PROVIDER.CREDENTIALS;
  }
  if (identity.provider === LOGIN_PROVIDER.TELEGRAM) {
    return LOGIN_PROVIDER.TELEGRAM;
  }
  return identity.provider;
};
