import "server-only";
import { ACADEMIC_YEAR_STATUS, type ConsentStatus } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { toTeacherPupilConsentView } from "./pupil-consent-view.server";
import { isoTodayUtc } from "./school-pupil-shared.server";

export type TeacherRosterRow = {
  pupilId: string;
  displayName: string;
  enrolledSinceIso: string;
  hasConsent: boolean;
  isLegacyPending: boolean;
};

export type TeacherAddCandidate = {
  pupilId: string;
  displayName: string;
  hasConsent: boolean;
  isLegacyPending: boolean;
};

export type TeacherGroupPageData =
  | { kind: "no_active_year" }
  | { kind: "unassigned" }
  | {
      kind: "roster";
      gradeId: string;
      gradeName: string;
      yearClosed: boolean;
      pupils: TeacherRosterRow[];
      addCandidates: TeacherAddCandidate[];
    };

export async function loadTeacherGroupPage(
  db: PrismaClient,
  teacherUserId: string,
): Promise<TeacherGroupPageData> {
  const organizationId = await getDefaultOrganizationId(db);
  const todayIso = isoTodayUtc();

  const activeYear = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true, status: true },
  });
  if (!activeYear) {
    return { kind: "no_active_year" };
  }

  const assignment = await db.teacherAssignment.findFirst({
    where: { userId: teacherUserId, academicYearId: activeYear.id },
    select: { grade: { select: { id: true, name: true } } },
  });
  if (!assignment) {
    return { kind: "unassigned" };
  }

  const legacyRow = await db.appSetting.findUnique({
    where: { key: "legacy_consent_deadline_on" },
    select: { value: true },
  });
  const legacyDeadlineOn =
    legacyRow?.value && typeof legacyRow.value === "string" ? legacyRow.value : null;

  const gradeId = assignment.grade.id;
  const enrollments = await db.enrollment.findMany({
    where: { gradeId, academicYearId: activeYear.id, endsOn: null },
    orderBy: [{ pupil: { lastName: "asc" } }, { pupil: { firstName: "asc" } }],
    select: {
      startsOn: true,
      pupil: {
        select: {
          id: true,
          lastName: true,
          firstName: true,
          middleName: true,
          consents: { select: { status: true }, take: 1, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  const pupils: TeacherRosterRow[] = enrollments.map((row) => {
    const consentStatus = row.pupil.consents[0]?.status ?? null;
    const consent = toTeacherPupilConsentView(consentStatus as ConsentStatus | null, todayIso, legacyDeadlineOn);
    return {
      pupilId: row.pupil.id,
      displayName: formatDisplayName(row.pupil),
      enrolledSinceIso: row.startsOn.toISOString().slice(0, 10),
      hasConsent: consent.hasConsent,
      isLegacyPending: consent.isLegacyPending,
    };
  });

  const unassigned = await db.pupil.findMany({
    where: {
      organizationId,
      isActive: true,
      enrollments: { none: { academicYearId: activeYear.id, endsOn: null } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      lastName: true,
      firstName: true,
      middleName: true,
      consents: { select: { status: true }, take: 1, orderBy: { createdAt: "desc" } },
    },
  });

  const addCandidates: TeacherAddCandidate[] = unassigned.map((pupil) => {
    const consentStatus = pupil.consents[0]?.status ?? null;
    const consent = toTeacherPupilConsentView(consentStatus as ConsentStatus | null, todayIso, legacyDeadlineOn);
    return {
      pupilId: pupil.id,
      displayName: formatDisplayName(pupil),
      hasConsent: consent.hasConsent,
      isLegacyPending: consent.isLegacyPending,
    };
  });

  return {
    kind: "roster",
    gradeId,
    gradeName: assignment.grade.name,
    yearClosed: false,
    pupils,
    addCandidates,
  };
}
