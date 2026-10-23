/**
 * `--replace` for `db:seed:dev`: drop this fixture (and the previous two-group fixture,
 * which shares year ids) plus empty `Race-*` draft years, then the caller inserts again.
 * Reference data, the Bible, and the admin / `teacher@example.com` passwords stay.
 * Brick rows and pupil audit text go through the privileged deletion functions (INV-16, INV-17).
 */
import { LOGIN_PROVIDER, USER_ROLE } from "@sunschool/domain";
import { deleteBrickLedgerForPupilPrivileged } from "../../deletion/delete-brick-ledger-for-pupil";
import { scrubAuditLogForPupilPrivileged } from "../../deletion/scrub-audit-log-for-pupil";
import { scrubAuditLogForUserPrivileged } from "../../deletion/scrub-audit-log-for-user";
import type { SeedTx } from "../reference/types";
import { GRADE_KEY, YEAR_KEY, deterministicUuid, type Fixture, type YearKey } from "./fixture";
import { replaceDevFamilies } from "./families";
import type { PeopleFixture } from "./people";

const DEV_TEACHER_EMAIL = "teacher@example.com";

/** Ids of the analytics-only fixture this set replaces. */
const LEGACY_GRADE_KEYS = ["g1", "g2"] as const;
const LEGACY_USER_NAMES = ["user:teacher-group-1"] as const;

function legacyPupilKeys(): string[] {
  const keys: string[] = [];
  const push = (prefix: string, count: number) => {
    for (let i = 1; i <= count; i += 1) keys.push(`${prefix}${i}`);
  };
  push("a", 22);
  push("b", 10);
  push("n", 9);
  push("m", 5);
  return keys;
}

const id = (name: string): string => deterministicUuid(name);

function yearIds(): string[] {
  return (Object.values(YEAR_KEY) as YearKey[]).map((key) => id(`year:${key}`));
}

function gradeIds(fixture: Fixture): string[] {
  const keys = new Set<string>([...Object.values(GRADE_KEY), ...LEGACY_GRADE_KEYS]);
  for (const row of fixture.enrollments) keys.add(row.gradeKey);
  return [...keys].map((key) => id(`grade:${key}`));
}

async function erasePupils(tx: SeedTx, pupilIds: string[]): Promise<void> {
  if (pupilIds.length === 0) return;
  const familyIds = (
    await tx.pupil.findMany({ where: { id: { in: pupilIds }, familyId: { not: null } }, select: { familyId: true } })
  ).flatMap((row) => (row.familyId ? [row.familyId] : []));

  await tx.homeworkScoreEvent.deleteMany({ where: { check: { pupilId: { in: pupilIds } } } });
  await tx.homeworkVerseScore.deleteMany({ where: { check: { pupilId: { in: pupilIds } } } });
  await tx.achievementEvidence.deleteMany({ where: { check: { pupilId: { in: pupilIds } } } });
  for (const pupilId of pupilIds) await scrubAuditLogForPupilPrivileged(tx, pupilId);
  await tx.homeworkCheck.deleteMany({ where: { pupilId: { in: pupilIds } } });
  for (const pupilId of pupilIds) await deleteBrickLedgerForPupilPrivileged(tx, pupilId);
  await tx.achievementAward.deleteMany({ where: { pupilId: { in: pupilIds } } });
  await tx.penalty.deleteMany({ where: { pupilId: { in: pupilIds } } });
  await tx.recitationAttempt.deleteMany({ where: { pupilId: { in: pupilIds } } });
  await tx.voicePhotoConsent.deleteMany({ where: { pupilId: { in: pupilIds } } });
  await tx.deletionRequest.deleteMany({ where: { subjectPupilId: { in: pupilIds } } });
  await tx.enrollment.deleteMany({ where: { pupilId: { in: pupilIds } } });
  await tx.childDataConsent.deleteMany({ where: { pupilId: { in: pupilIds } } });
  await tx.analyticsPupilYearSnapshot.deleteMany({ where: { pupilId: { in: pupilIds } } });
  await tx.pupil.deleteMany({ where: { id: { in: pupilIds } } });

  for (const familyId of new Set(familyIds)) {
    if ((await tx.pupil.count({ where: { familyId } })) > 0) continue;
    await tx.familyAdult.deleteMany({ where: { familyId } });
    await tx.family.delete({ where: { id: familyId } });
  }
}

async function eraseYear(tx: SeedTx, yearId: string): Promise<void> {
  const lessons = await tx.lesson.findMany({ where: { academicYearId: yearId }, select: { id: true } });
  const lessonIds = lessons.map((row) => row.id);

  await tx.homeworkScoreEvent.deleteMany({ where: { check: { lessonId: { in: lessonIds } } } });
  await tx.homeworkVerseScore.deleteMany({ where: { check: { lessonId: { in: lessonIds } } } });
  await tx.achievementEvidence.deleteMany({ where: { check: { lessonId: { in: lessonIds } } } });
  await tx.homeworkCheck.deleteMany({ where: { lessonId: { in: lessonIds } } });
  await tx.achievementAward.deleteMany({ where: { academicYearId: yearId } });
  await tx.penalty.deleteMany({ where: { lessonId: { in: lessonIds } } });
  await tx.recitationAttempt.deleteMany({ where: { lessonVerse: { lessonId: { in: lessonIds } } } });
  await tx.lessonGoldenVerse.deleteMany({ where: { lessonId: { in: lessonIds } } });
  await tx.gradeEvent.deleteMany({ where: { lessonId: { in: lessonIds } } });
  await tx.lesson.deleteMany({ where: { academicYearId: yearId } });
  await tx.enrollment.deleteMany({ where: { academicYearId: yearId } });
  await tx.teacherAssignment.deleteMany({ where: { academicYearId: yearId } });
  await tx.gradeAchievementPeriod.deleteMany({ where: { gradeSettings: { academicYearId: yearId } } });
  await tx.gradeSettings.deleteMany({ where: { academicYearId: yearId } });
  await tx.analyticsPupilYearSnapshot.deleteMany({ where: { academicYearId: yearId } });
  await tx.analyticsGroupYearSnapshot.deleteMany({ where: { academicYearId: yearId } });
  await tx.academicYear.delete({ where: { id: yearId } });
}

async function deleteFixtureUsers(tx: SeedTx, userIds: string[]): Promise<void> {
  const teacher = await tx.loginIdentity.findUnique({
    where: { provider_providerAccountId: { provider: LOGIN_PROVIDER.CREDENTIALS, providerAccountId: DEV_TEACHER_EMAIL } },
    select: { userId: true },
  });
  const admins = await tx.userRoleAssignment.findMany({ where: { role: USER_ROLE.ADMIN }, select: { userId: true } });
  const protectedIds = new Set<string>([...admins.map((row) => row.userId), ...(teacher ? [teacher.userId] : [])]);
  const ids = userIds.filter((userId) => !protectedIds.has(userId));
  if (ids.length === 0) return;

  await tx.deletionRequest.deleteMany({ where: { subjectUserId: { in: ids } } });
  await tx.accessRequest.deleteMany({ where: { userId: { in: ids } } });
  await tx.privacyConsent.deleteMany({ where: { userId: { in: ids } } });
  await tx.userRoleAssignment.deleteMany({ where: { userId: { in: ids } } });
  await tx.loginIdentity.deleteMany({ where: { userId: { in: ids } } });
  await tx.teacherAssignment.deleteMany({ where: { userId: { in: ids } } });
  for (const userId of ids) await scrubAuditLogForUserPrivileged(tx, userId);
  await tx.appUser.deleteMany({ where: { id: { in: ids } } });
}

async function deleteEmptyRaceYears(tx: SeedTx): Promise<number> {
  const races = await tx.academicYear.findMany({
    where: { name: { startsWith: "Race-" } },
    select: { id: true },
  });
  let removed = 0;
  for (const race of races) {
    const lessons = await tx.lesson.count({ where: { academicYearId: race.id } });
    const enrollments = await tx.enrollment.count({ where: { academicYearId: race.id } });
    const bricks = await tx.brickLedger.count({ where: { academicYearId: race.id } });
    if (lessons > 0 || enrollments > 0 || bricks > 0) continue;
    await tx.teacherAssignment.deleteMany({ where: { academicYearId: race.id } });
    await tx.gradeAchievementPeriod.deleteMany({ where: { gradeSettings: { academicYearId: race.id } } });
    await tx.gradeSettings.deleteMany({ where: { academicYearId: race.id } });
    await tx.analyticsPupilYearSnapshot.deleteMany({ where: { academicYearId: race.id } });
    await tx.analyticsGroupYearSnapshot.deleteMany({ where: { academicYearId: race.id } });
    await tx.academicYear.delete({ where: { id: race.id } });
    removed += 1;
  }
  return removed;
}

export async function replaceDevFixture(tx: SeedTx, fixture: Fixture, people: PeopleFixture): Promise<void> {
  await replaceDevFamilies(tx);
  const fixtureYearIds = yearIds();
  const fixtureGradeIds = gradeIds(fixture);
  const pupilIdSet = new Set<string>([
    ...fixture.pupils.map((pupil) => id(`pupil:${pupil.key}`)),
    ...legacyPupilKeys().map((key) => id(`pupil:${key}`)),
  ]);
  const enrolled = await tx.enrollment.findMany({
    where: { OR: [{ academicYearId: { in: fixtureYearIds } }, { gradeId: { in: fixtureGradeIds } }] },
    select: { pupilId: true },
  });
  for (const row of enrolled) pupilIdSet.add(row.pupilId);

  const existingPupils = await tx.pupil.findMany({
    where: { id: { in: [...pupilIdSet] } },
    select: { id: true },
  });
  await erasePupils(tx, existingPupils.map((row) => row.id));

  const leftoverBricks = await tx.brickLedger.count({ where: { academicYearId: { in: fixtureYearIds } } });
  if (leftoverBricks > 0) {
    throw new Error(`${leftoverBricks} brick rows of the fixture years belong to pupils outside the fixture`);
  }

  for (const yearId of fixtureYearIds) {
    const year = await tx.academicYear.findUnique({ where: { id: yearId }, select: { id: true } });
    if (year) await eraseYear(tx, year.id);
  }

  await tx.gradeEvent.deleteMany({ where: { gradeId: { in: fixtureGradeIds } } });
  await tx.teacherAssignment.deleteMany({ where: { gradeId: { in: fixtureGradeIds } } });
  await tx.gradeAchievementPeriod.deleteMany({ where: { gradeSettings: { gradeId: { in: fixtureGradeIds } } } });
  await tx.gradeSettings.deleteMany({ where: { gradeId: { in: fixtureGradeIds } } });
  await tx.analyticsGroupYearSnapshot.deleteMany({ where: { gradeId: { in: fixtureGradeIds } } });
  await tx.grade.deleteMany({ where: { id: { in: fixtureGradeIds } } });

  const userIds = [
    ...people.users.map((user) => id(`user:${user.key}`)),
    ...LEGACY_USER_NAMES.map((name) => id(name)),
  ];
  await deleteFixtureUsers(tx, userIds);
  await deleteEmptyRaceYears(tx);
}
