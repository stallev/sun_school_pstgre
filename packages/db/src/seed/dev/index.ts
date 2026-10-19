import {
  ACADEMIC_YEAR_STATUS,
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  CONSENT_CHANNEL,
  CONSENT_STATUS,
  CONSENT_TYPE,
  LESSON_STATUS,
  LOGIN_PROVIDER,
  SCORE_SOURCE,
  USER_ROLE,
  defaultGradeScoreWeights,
} from "@sunschool/domain";
import { writeAudit } from "../../audit/write-audit";
import { assertDbEnvironment } from "../../env-guard";
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import type { SeedTx } from "../reference/types";
import {
  GOLDEN_VERSES,
  GRADE_KEY,
  SETTINGS_MAX_VERSES,
  buildFixture,
  deterministicUuid,
  type Fixture,
  type FixtureLesson,
  type GradeKey,
} from "./fixture";
import { ensureClosedYearSnapshotsAfterDevSeed } from "./ensure-year-snapshots";

/**
 * `db:seed:dev` — fake data for the multi-year analytics screens (seed_data_spec set D):
 * two groups, two closed years and one active year with four completed lessons, ~46 pupils.
 * Dev only. Not idempotent by merging: if the fixture is already present it does nothing; to reseed,
 * delete the fixture first (`db:delete:year -- --year <name> --all-pupils` for each of the three years).
 * Requires: `seed:reference`, the dev teacher (`seed:teacher`) and no other ACTIVE year.
 */
const DEV_FIXTURE_LOCK_KEY = "7340125511";
const CONSENT_TEXT_VERSION_KEY = "consent_text_version";
const CHILD_CONSENT_TEXT_VERSION_KEY = "child_data_consent_text_version";
const CHILD_CONSENT_TEXT_VERSION_DEFAULT = "v1";
const DEV_TEACHER_EMAIL = "teacher@example.com";
const GROUP_ONE_TEACHER_EMAIL = "teacher.group1@example.test";
const GROUP_NAMES: Record<GradeKey, string> = { g1: "Старшая 1", g2: "Старшая 2" };

export const DEV_SEED_ERROR = {
  NOT_DEV: "NOT_DEV",
  NO_ORGANIZATION: "NO_ORGANIZATION",
  NO_DEV_TEACHER: "NO_DEV_TEACHER",
  NO_CONSENT_TEXT_VERSION: "NO_CONSENT_TEXT_VERSION",
  NO_BIBLE_BOOK: "NO_BIBLE_BOOK",
  ACTIVE_YEAR_EXISTS: "ACTIVE_YEAR_EXISTS",
} as const;
export type DevSeedError = (typeof DEV_SEED_ERROR)[keyof typeof DEV_SEED_ERROR];

export class DevSeedFailure extends Error {
  readonly reason: DevSeedError;

  constructor(reason: DevSeedError, message: string) {
    super(message);
    this.name = "DevSeedFailure";
    this.reason = reason;
  }
}

export type DevSeedReport = {
  skipped: boolean;
  pupils: number;
  lessons: number;
  checks: number;
  bricks: number;
};

const id = (name: string): string => deterministicUuid(name);
const date = (iso: string): Date => new Date(`${iso}T00:00:00Z`);
const lessonKey = (lesson: Pick<FixtureLesson, "gradeKey" | "yearKey" | "index">): string =>
  `${lesson.gradeKey}:${lesson.yearKey}:${lesson.index}`;

async function readTextVersion(tx: SeedTx, key: string): Promise<string | null> {
  const row = await tx.appSetting.findUnique({ where: { key } });
  return typeof row?.value === "string" && row.value.length > 0 ? row.value : null;
}

async function resolveGoldenVerseIds(tx: SeedTx, organizationId: string): Promise<string[]> {
  const ids: string[] = [];
  for (const [index, [bookShort, chapter, firstVerse, lastVerse]] of GOLDEN_VERSES.entries()) {
    const book = await tx.bibleBook.findFirst({ where: { shortRu: bookShort } });
    if (!book) {
      throw new DevSeedFailure(DEV_SEED_ERROR.NO_BIBLE_BOOK, `No bible_book "${bookShort}": run db:seed:reference first`);
    }
    const where = {
      organizationId,
      bookId: book.id,
      startChapter: chapter,
      startVerse: firstVerse,
      endChapter: chapter,
      endVerse: lastVerse,
    };
    const existing = await tx.goldenVerse.findFirst({ where, select: { id: true } });
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const created = await tx.goldenVerse.create({ data: { id: id(`golden-verse:${index}`), ...where } });
    ids.push(created.id);
  }
  return ids;
}

async function createGroupOneTeacher(tx: SeedTx, organizationId: string, textVersion: string): Promise<string> {
  const userId = id("user:teacher-group-1");
  const now = new Date();
  await tx.appUser.create({
    data: {
      id: userId,
      organizationId,
      status: ACCOUNT_STATUS.ACTIVE,
      email: GROUP_ONE_TEACHER_EMAIL,
      lastName: "Фикстура",
      firstName: "Учитель Старшей 1",
      firstLoginAt: now,
      roles: { create: { role: USER_ROLE.TEACHER } },
    },
  });
  await tx.privacyConsent.create({
    data: { userId, textVersion, acceptedAt: now, type: CONSENT_TYPE.PD_PROCESSING },
  });
  return userId;
}

/** The transactional core, separate from the lock/guard wrapper so tests can roll it back. */
export async function seedDevInTx(tx: SeedTx, fixture: Fixture = buildFixture()): Promise<DevSeedReport> {
  const empty: DevSeedReport = { skipped: true, pupils: 0, lessons: 0, checks: 0, bricks: 0 };
  const firstYear = fixture.years[0]!;
  if (await tx.academicYear.findUnique({ where: { id: id(`year:${firstYear.key}`) } })) return empty;

  const organization = await tx.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!organization) throw new DevSeedFailure(DEV_SEED_ERROR.NO_ORGANIZATION, "No organization: run db:seed:reference first");
  const consentVersion = await readTextVersion(tx, CONSENT_TEXT_VERSION_KEY);
  if (!consentVersion) {
    throw new DevSeedFailure(DEV_SEED_ERROR.NO_CONSENT_TEXT_VERSION, "No consent_text_version: run db:seed:reference first");
  }
  const childConsentVersion =
    (await readTextVersion(tx, CHILD_CONSENT_TEXT_VERSION_KEY)) ?? CHILD_CONSENT_TEXT_VERSION_DEFAULT;
  const devTeacher = await tx.loginIdentity.findUnique({
    where: { provider_providerAccountId: { provider: LOGIN_PROVIDER.CREDENTIALS, providerAccountId: DEV_TEACHER_EMAIL } },
    select: { userId: true },
  });
  if (!devTeacher) {
    throw new DevSeedFailure(DEV_SEED_ERROR.NO_DEV_TEACHER, `No ${DEV_TEACHER_EMAIL}: run db:seed:teacher first`);
  }
  if (await tx.academicYear.findFirst({ where: { organizationId: organization.id, status: ACADEMIC_YEAR_STATUS.ACTIVE } })) {
    throw new DevSeedFailure(DEV_SEED_ERROR.ACTIVE_YEAR_EXISTS, "An ACTIVE year exists: run db:delete:year first");
  }

  const organizationId = organization.id;
  const teacherIds: Record<GradeKey, string> = {
    g1: await createGroupOneTeacher(tx, organizationId, consentVersion),
    g2: devTeacher.userId,
  };
  const goldenVerseIds = await resolveGoldenVerseIds(tx, organizationId);

  await tx.academicYear.createMany({
    data: fixture.years.map((year) => ({
      id: id(`year:${year.key}`),
      organizationId,
      name: year.name,
      startsOn: date(year.startsOn),
      endsOn: date(year.endsOn),
      status: year.status,
    })),
  });
  await tx.grade.createMany({
    data: (Object.values(GRADE_KEY) as GradeKey[]).map((gradeKey) => ({
      id: id(`grade:${gradeKey}`),
      organizationId,
      name: GROUP_NAMES[gradeKey],
      ageMin: 10,
      ageMax: 11,
    })),
  });
  const gradeYears = fixture.years.flatMap((year) =>
    (Object.values(GRADE_KEY) as GradeKey[]).map((gradeKey) => ({ year, gradeKey })),
  );
  await tx.gradeSettings.createMany({
    data: gradeYears.map(({ year, gradeKey }) => ({
      gradeId: id(`grade:${gradeKey}`),
      academicYearId: id(`year:${year.key}`),
      maxVersesPerLesson: SETTINGS_MAX_VERSES,
      weights: defaultGradeScoreWeights(),
    })),
  });
  await tx.teacherAssignment.createMany({
    data: gradeYears.map(({ year, gradeKey }) => ({
      userId: teacherIds[gradeKey],
      gradeId: id(`grade:${gradeKey}`),
      academicYearId: id(`year:${year.key}`),
    })),
  });

  await tx.pupil.createMany({
    data: fixture.pupils.map((pupil) => ({
      id: id(`pupil:${pupil.key}`),
      organizationId,
      lastName: pupil.lastName,
      firstName: pupil.firstName,
      birthDate: date(pupil.birthDate),
      isActive: pupil.isActive,
    })),
  });
  await tx.childDataConsent.createMany({
    data: fixture.pupils.map((pupil) => ({
      pupilId: id(`pupil:${pupil.key}`),
      channel: CONSENT_CHANNEL.PAPER,
      textVersion: childConsentVersion,
      signedOn: date(pupil.signedOn),
      markedById: devTeacher.userId,
      status: CONSENT_STATUS.ACTIVE,
    })),
  });
  await tx.enrollment.createMany({
    data: fixture.enrollments.map((row) => ({
      pupilId: id(`pupil:${row.pupilKey}`),
      gradeId: id(`grade:${row.gradeKey}`),
      academicYearId: id(`year:${row.yearKey}`),
      startsOn: date(row.startsOn),
      endsOn: row.endsOn ? date(row.endsOn) : null,
    })),
  });

  await tx.lesson.createMany({
    data: fixture.lessons.map((lesson) => ({
      id: id(`lesson:${lessonKey(lesson)}`),
      gradeId: id(`grade:${lesson.gradeKey}`),
      academicYearId: id(`year:${lesson.yearKey}`),
      title: lesson.title,
      lessonDate: date(lesson.date),
      ordinal: lesson.index + 1,
      leadTeacherId: teacherIds[lesson.gradeKey],
      kind: lesson.kind,
      hasTest: lesson.hasTest,
      status: LESSON_STATUS.CHECK_COMPLETED,
    })),
  });
  await tx.lessonGoldenVerse.createMany({
    data: fixture.lessons.flatMap((lesson) =>
      lesson.verseIndexes.map((verseIndex, position) => ({
        id: id(`lesson-verse:${lessonKey(lesson)}:${position + 1}`),
        lessonId: id(`lesson:${lessonKey(lesson)}`),
        goldenVerseId: goldenVerseIds[verseIndex]!,
        position: position + 1,
      })),
    ),
  });

  const checkedAt = (isoDate: string): Date => new Date(`${isoDate}T13:00:00Z`);
  const lessonByKey = new Map(fixture.lessons.map((lesson) => [lessonKey(lesson), lesson]));
  const previousRegular = (lesson: FixtureLesson): FixtureLesson | null => {
    for (let index = lesson.index - 1; index >= 0; index -= 1) {
      const candidate = lessonByKey.get(lessonKey({ ...lesson, index }));
      if (candidate?.kind === "REGULAR") return candidate;
    }
    return null;
  };

  await tx.homeworkCheck.createMany({
    data: fixture.checks.map((check) => {
      const lesson = lessonByKey.get(lessonKey({ gradeKey: check.gradeKey, yearKey: check.yearKey, index: check.lessonIndex }))!;
      return {
        id: id(`check:${lessonKey(lesson)}:${check.pupilKey}`),
        lessonId: id(`lesson:${lessonKey(lesson)}`),
        pupilId: id(`pupil:${check.pupilKey}`),
        present: check.present,
        homeworkChecked: true,
        testScore: check.testScore,
        notebookScore: check.notebookScore,
        singing: check.singing,
        late: check.late,
        pointsTotal: check.pointsTotal,
        scoringSnapshot: check.scoringSnapshot as unknown as Prisma.InputJsonValue,
        checkedById: teacherIds[check.gradeKey],
        checkedAt: checkedAt(lesson.date),
      };
    }),
  });
  await tx.homeworkVerseScore.createMany({
    data: fixture.checks.flatMap((check) => {
      const lesson = lessonByKey.get(lessonKey({ gradeKey: check.gradeKey, yearKey: check.yearKey, index: check.lessonIndex }))!;
      const source = previousRegular(lesson);
      return check.verseScores.map((score, position) => ({
        checkId: id(`check:${lessonKey(lesson)}:${check.pupilKey}`),
        lessonVerseId: id(`lesson-verse:${lessonKey(source!)}:${position + 1}`),
        score,
        source: SCORE_SOURCE.MANUAL,
        scoredAt: checkedAt(lesson.date),
        scoredById: teacherIds[check.gradeKey],
      }));
    }),
  });
  await tx.brickLedger.createMany({
    data: fixture.bricks.map((brick) => ({
      pupilId: id(`pupil:${brick.pupilKey}`),
      academicYearId: id(`year:${brick.yearKey}`),
      quantity: brick.quantity,
      issuedOn: date(brick.issuedOn),
      issuedById: teacherIds[brick.gradeKey],
      note: brick.note,
    })),
  });

  const report: DevSeedReport = {
    skipped: false,
    pupils: fixture.pupils.length,
    lessons: fixture.lessons.length,
    checks: fixture.checks.length,
    bricks: fixture.bricks.length,
  };
  await writeAudit(tx, {
    actorUserId: null,
    source: AUDIT_SOURCE.SYSTEM,
    entityType: AUDIT_ENTITY_TYPE.SEED,
    entityId: id(`year:${firstYear.key}`),
    action: AUDIT_ACTION.SEED_RUN,
    newValue: { script: "seed:dev", ...report },
  });
  return report;
}

/** Refuses unless `APP_ENV` is dev, then lock + marker guard + core. */
export async function seedDev(prisma: PrismaClient, appEnv: string | undefined): Promise<DevSeedReport> {
  if (appEnv !== "dev") {
    throw new DevSeedFailure(DEV_SEED_ERROR.NOT_DEV, "db:seed:dev runs only when APP_ENV=dev");
  }
  const report = await prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${DEV_FIXTURE_LOCK_KEY})`);
      await assertDbEnvironment(tx, appEnv, { allowMarkerWrite: false });
      return seedDevInTx(tx);
    },
    { maxWait: 20_000, timeout: 180_000 },
  );
  await ensureClosedYearSnapshotsAfterDevSeed(prisma);
  return report;
}
