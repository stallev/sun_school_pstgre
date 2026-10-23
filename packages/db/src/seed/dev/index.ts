import {
  ACADEMIC_YEAR_STATUS,
  APP_LOCALE,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  BIBLE_TRANSLATION_STATUS,
  CONSENT_CHANNEL,
  CONSENT_STATUS,
  LESSON_KIND,
  LOGIN_PROVIDER,
  SCORE_SOURCE,
  USER_ROLE,
  defaultGradeScoreWeights,
} from "@sunschool/domain";
import { writeAudit } from "../../audit/write-audit";
import { assertDbEnvironment } from "../../env-guard";
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { NIV_TRANSLATION_CODE } from "../bible/constants";
import type { SeedTx } from "../reference/types";
import { ensureClosedYearSnapshotsAfterDevSeed } from "./ensure-year-snapshots";
import {
  FIXTURE_PUPIL_CONSENT,
  GOLDEN_VERSES,
  GRADE_KEY,
  SETTINGS_MAX_VERSES,
  buildFixture,
  deterministicUuid,
  fixtureLessonName,
  type Fixture,
  type FixtureLesson,
  type GradeKey,
} from "./fixture";
import { FIXTURE_USER_KEY, buildPeopleFixture } from "./people";
import { seedDevFamiliesInTx, type ParentSeedInput } from "./families";
import { replaceDevFixture } from "./replace-fixture";
import { writeFixtureDeletions, writeFixtureEvents, writeFixtureUsers } from "./write-people";

/**
 * `db:seed:dev` — fake data for the MVP screens (seed_data_spec §8):
 * three groups, two closed years, one active year with a lesson still to check,
 * access and deletion queues, calendar events.
 * Dev only. A second run does nothing while this fixture's year ids are present.
 * `replace: true` (CLI `--replace`) deletes those rows and empty `Race-*` years, then inserts again.
 * Requires: `seed:reference`, the dev teacher (`seed:teacher`) and no other ACTIVE year.
 */
const DEV_FIXTURE_LOCK_KEY = "7340125511";
const CONSENT_TEXT_VERSION_KEY = "consent_text_version";
const CHILD_CONSENT_TEXT_VERSION_KEY = "child_data_consent_text_version";
const CHILD_CONSENT_TEXT_VERSION_DEFAULT = "v1";
const DEV_TEACHER_EMAIL = "teacher@example.com";
const INSERT_CHUNK = 400;

const GROUP_NAMES: Record<GradeKey, string> = {
  junior: "Младшая",
  middle: "Средняя",
  senior: "Старшая",
};
const GROUP_AGES: Record<GradeKey, { ageMin: number; ageMax: number }> = {
  junior: { ageMin: 6, ageMax: 8 },
  middle: { ageMin: 9, ageMax: 11 },
  senior: { ageMin: 12, ageMax: 14 },
};

export const DEV_SEED_ERROR = {
  NOT_DEV: "NOT_DEV",
  NO_ORGANIZATION: "NO_ORGANIZATION",
  NO_DEV_TEACHER: "NO_DEV_TEACHER",
  NO_CONSENT_TEXT_VERSION: "NO_CONSENT_TEXT_VERSION",
  NO_BIBLE_BOOK: "NO_BIBLE_BOOK",
  ACTIVE_YEAR_EXISTS: "ACTIVE_YEAR_EXISTS",
  NO_PARENT_CREDENTIALS: "NO_PARENT_CREDENTIALS",
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
  accessRequests: number;
  deletions: number;
  events: number;
  families: number;
};

const id = (name: string): string => deterministicUuid(name);
const date = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

const EMPTY_REPORT: DevSeedReport = {
  skipped: true,
  pupils: 0,
  lessons: 0,
  checks: 0,
  bricks: 0,
  accessRequests: 0,
  deletions: 0,
  events: 0,
  families: 0,
};

async function insertInChunks<T>(rows: readonly T[], insert: (chunk: T[]) => Promise<unknown>): Promise<void> {
  for (let offset = 0; offset < rows.length; offset += INSERT_CHUNK) {
    const chunk = rows.slice(offset, offset + INSERT_CHUNK);
    if (chunk.length > 0) await insert(chunk);
  }
}

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

/** The transactional core, separate from the lock/guard wrapper so tests can roll it back. */
export async function seedDevInTx(
  tx: SeedTx,
  fixture: Fixture = buildFixture(),
  options?: { replace?: boolean; parent?: ParentSeedInput },
): Promise<DevSeedReport> {
  const people = buildPeopleFixture(fixture);
  if (options?.replace) await replaceDevFixture(tx, fixture, people);

  const firstYear = fixture.years[0]!;
  const fixturePresent =
    !options?.replace && Boolean(await tx.academicYear.findUnique({ where: { id: id(`year:${firstYear.key}`) } }));
  if (fixturePresent) {
    const familiesReport = options?.parent ? await seedDevFamiliesInTx(tx, options.parent) : { skipped: true, families: 0 };
    return { ...EMPTY_REPORT, families: familiesReport.skipped ? 0 : familiesReport.families };
  }

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
  const niv = await tx.bibleTranslation.findUnique({
    where: { code: NIV_TRANSLATION_CODE },
    select: { status: true },
  });
  const seniorLanguage = niv?.status === BIBLE_TRANSLATION_STATUS.READY ? APP_LOCALE.EN : APP_LOCALE.RU;
  const admin = await tx.userRoleAssignment.findFirst({
    where: { role: USER_ROLE.ADMIN },
    select: { userId: true },
  });
  const actorUserId = admin?.userId ?? devTeacher.userId;
  const teacherIds: Record<GradeKey, string> = {
    junior: id(`user:${FIXTURE_USER_KEY.TEACHER_JUNIOR}`),
    middle: id(`user:${FIXTURE_USER_KEY.TEACHER_MIDDLE}`),
    senior: devTeacher.userId,
  };

  await writeFixtureUsers(tx, people, { organizationId, consentVersion, actorUserId });
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
      ageMin: GROUP_AGES[gradeKey].ageMin,
      ageMax: GROUP_AGES[gradeKey].ageMax,
      language: gradeKey === GRADE_KEY.SENIOR ? seniorLanguage : APP_LOCALE.RU,
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
    data: fixture.pupils.flatMap((pupil) => {
      if (pupil.consent === FIXTURE_PUPIL_CONSENT.NONE) return [];
      const legacy = pupil.consent === FIXTURE_PUPIL_CONSENT.LEGACY_PENDING;
      return [{
        pupilId: id(`pupil:${pupil.key}`),
        channel: CONSENT_CHANNEL.PAPER,
        textVersion: childConsentVersion,
        signedOn: legacy ? null : date(pupil.signedOn ?? pupil.birthDate),
        markedById: devTeacher.userId,
        status: legacy ? CONSENT_STATUS.LEGACY_PENDING : CONSENT_STATUS.ACTIVE,
      }];
    }),
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
      id: id(`lesson:${fixtureLessonName(lesson)}`),
      gradeId: id(`grade:${lesson.gradeKey}`),
      academicYearId: id(`year:${lesson.yearKey}`),
      title: lesson.title,
      lessonDate: date(lesson.date),
      ordinal: lesson.index + 1,
      leadTeacherId: teacherIds[lesson.gradeKey],
      kind: lesson.kind,
      hasTest: lesson.hasTest,
      status: lesson.status,
    })),
  });
  await tx.lessonGoldenVerse.createMany({
    data: fixture.lessons.flatMap((lesson) =>
      lesson.verseIndexes.map((verseIndex, position) => ({
        id: id(`lesson-verse:${fixtureLessonName(lesson)}:${position + 1}`),
        lessonId: id(`lesson:${fixtureLessonName(lesson)}`),
        goldenVerseId: goldenVerseIds[verseIndex]!,
        position: position + 1,
      })),
    ),
  });

  const checkedAt = (isoDate: string): Date => new Date(`${isoDate}T13:00:00Z`);
  const lessonByName = new Map(fixture.lessons.map((lesson) => [fixtureLessonName(lesson), lesson]));
  const previousRegular = (lesson: FixtureLesson): FixtureLesson | null => {
    for (let index = lesson.index - 1; index >= 0; index -= 1) {
      const candidate = lessonByName.get(fixtureLessonName({ ...lesson, index }));
      if (candidate?.kind === LESSON_KIND.REGULAR) return candidate;
    }
    return null;
  };

  const checkRows = fixture.checks.map((check) => {
    const lesson = lessonByName.get(fixtureLessonName({ gradeKey: check.gradeKey, yearKey: check.yearKey, index: check.lessonIndex }))!;
    return {
      id: id(`check:${fixtureLessonName(lesson)}:${check.pupilKey}`),
      lessonId: id(`lesson:${fixtureLessonName(lesson)}`),
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
  });
  await insertInChunks(checkRows, (chunk) => tx.homeworkCheck.createMany({ data: chunk }));

  const verseRows = fixture.checks.flatMap((check) => {
    const lesson = lessonByName.get(fixtureLessonName({ gradeKey: check.gradeKey, yearKey: check.yearKey, index: check.lessonIndex }))!;
    const source = previousRegular(lesson);
    return check.verseScores.map((score, position) => ({
      checkId: id(`check:${fixtureLessonName(lesson)}:${check.pupilKey}`),
      lessonVerseId: id(`lesson-verse:${fixtureLessonName(source!)}:${position + 1}`),
      score,
      source: SCORE_SOURCE.MANUAL,
      scoredAt: checkedAt(lesson.date),
      scoredById: teacherIds[check.gradeKey],
    }));
  });
  await insertInChunks(verseRows, (chunk) => tx.homeworkVerseScore.createMany({ data: chunk }));

  await insertInChunks(
    fixture.bricks.map((brick) => ({
      pupilId: id(`pupil:${brick.pupilKey}`),
      academicYearId: id(`year:${brick.yearKey}`),
      quantity: brick.quantity,
      issuedOn: date(brick.issuedOn),
      issuedById: teacherIds[brick.gradeKey],
      note: brick.note,
    })),
    (chunk) => tx.brickLedger.createMany({ data: chunk }),
  );

  await writeFixtureEvents(tx, people);
  await writeFixtureDeletions(tx, people, actorUserId);

  const familiesReport = options?.parent ? await seedDevFamiliesInTx(tx, options.parent) : { skipped: true, families: 0 };

  const report: DevSeedReport = {
    skipped: false,
    pupils: fixture.pupils.length,
    lessons: fixture.lessons.length,
    checks: fixture.checks.length,
    bricks: fixture.bricks.length,
    accessRequests: people.accessRequests.length,
    deletions: people.deletions.length,
    events: people.events.length,
    families: familiesReport.skipped ? 0 : familiesReport.families,
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

export type SeedDevOptions = { replace?: boolean; parent: ParentSeedInput };

/** Refuses unless `APP_ENV` is dev, then lock + marker guard + core. */
export async function seedDev(
  prisma: PrismaClient,
  appEnv: string | undefined,
  options: SeedDevOptions,
): Promise<DevSeedReport> {
  if (appEnv !== "dev") {
    throw new DevSeedFailure(DEV_SEED_ERROR.NOT_DEV, "db:seed:dev runs only when APP_ENV=dev");
  }
  const report = await prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${DEV_FIXTURE_LOCK_KEY})`);
      await assertDbEnvironment(tx, appEnv, { allowMarkerWrite: false });
      return seedDevInTx(tx, buildFixture(), options);
    },
    { maxWait: 20_000, timeout: 300_000 },
  );
  await ensureClosedYearSnapshotsAfterDevSeed(prisma);
  return report;
}
