/**
 * Pure fixture for `db:seed:dev` (seed_data_spec §8): three groups, three academic years.
 * No database access — names, scores and attendance come from a seeded PRNG, so every run matches.
 *
 * Years:  2024–2025 and 2025–2026 closed (10 lessons, 2 reviews, checks complete);
 *         2026–2027 active (4 completed lessons + 1 HELD lesson with a partial check).
 * Groups: «Младшая», «Средняя», «Старшая». In the active year each has 30 open enrollments.
 * Flow:   part of each cohort moves up a group the next year; six pupils change group
 *         mid-year in 2025–2026 (two rows in one year). Four pupils attend under 50 %.
 * People, access requests, deletion requests and calendar events live in `people.ts`.
 */
import { createHash } from "node:crypto";
import {
  ACADEMIC_YEAR_STATUS,
  CONSENT_STATUS,
  LESSON_KIND,
  LESSON_STATUS,
  buildScoringSnapshot,
  computePoints,
  defaultGradeScoreWeights,
  type AcademicYearStatus,
  type LessonKind,
  type LessonStatus,
  type ScoringSnapshot,
} from "@sunschool/domain";

export const YEAR_KEY = { Y1: "y1", Y2: "y2", Y3: "y3" } as const;
export type YearKey = (typeof YEAR_KEY)[keyof typeof YEAR_KEY];
export const GRADE_KEY = { JUNIOR: "junior", MIDDLE: "middle", SENIOR: "senior" } as const;
export type GradeKey = (typeof GRADE_KEY)[keyof typeof GRADE_KEY];

/** How a fixture pupil's child-data consent is stored. `NONE` means no row. */
export const FIXTURE_PUPIL_CONSENT = {
  PAPER: "PAPER",
  NONE: "NONE",
  LEGACY_PENDING: CONSENT_STATUS.LEGACY_PENDING,
} as const;
export type FixturePupilConsent = (typeof FIXTURE_PUPIL_CONSENT)[keyof typeof FIXTURE_PUPIL_CONSENT];

export const MAX_VERSES_PER_LESSON = 2;
export const SETTINGS_MAX_VERSES = 3;

/** Pupils of a HELD lesson who already have a finished check; the rest are still to check. */
const HELD_LESSON_CHECKED_COUNT = 10;
const LOW_ATTENDANCE_KEYS = ["a3", "b4", "c2", "p2"] as const;
const LATE_CHECK_TARGET = 4;

export type FixtureYear = {
  key: YearKey;
  name: string;
  startsOn: string;
  endsOn: string;
  status: AcademicYearStatus;
  lessonDates: string[];
  reviewIndexes: number[];
};

export type FixturePupil = {
  key: string;
  lastName: string;
  firstName: string;
  birthDate: string;
  isActive: boolean;
  /** Propensity to attend, 0..1. */
  attendance: number;
  /** Average level of homework, 0..1. */
  skill: number;
  signedOn: string | null;
  consent: FixturePupilConsent;
};

export type FixtureEnrollment = {
  pupilKey: string;
  gradeKey: GradeKey;
  yearKey: YearKey;
  startsOn: string;
  endsOn: string | null;
};

export type FixtureLesson = {
  gradeKey: GradeKey;
  yearKey: YearKey;
  index: number;
  title: string;
  date: string;
  kind: LessonKind;
  hasTest: boolean;
  status: LessonStatus;
  /** Indexes into `GOLDEN_VERSES`; empty for REVIEW. */
  verseIndexes: number[];
};

export type FixtureCheck = {
  gradeKey: GradeKey;
  yearKey: YearKey;
  lessonIndex: number;
  pupilKey: string;
  present: boolean;
  late: boolean;
  testScore: number | null;
  notebookScore: number | null;
  singing: boolean;
  /** Scores for the verses of the previous regular lesson, in position order. */
  verseScores: number[];
  pointsTotal: number;
  scoringSnapshot: ScoringSnapshot;
};

export type FixtureBrick = {
  pupilKey: string;
  yearKey: YearKey;
  gradeKey: GradeKey;
  quantity: number;
  issuedOn: string;
  note: string | null;
};

export type Fixture = {
  years: FixtureYear[];
  pupils: FixturePupil[];
  enrollments: FixtureEnrollment[];
  lessons: FixtureLesson[];
  checks: FixtureCheck[];
  bricks: FixtureBrick[];
};

/** Golden verses of the fixture: `[book short name (ru), chapter, first verse, last verse]`. */
export const GOLDEN_VERSES: readonly (readonly [string, number, number, number])[] = [
  ["Ин", 3, 16, 16],
  ["Ин", 14, 6, 6],
  ["Пс", 22, 1, 1],
  ["Притч", 3, 5, 6],
  ["Мф", 5, 16, 16],
  ["Мф", 6, 33, 33],
  ["Мф", 11, 28, 28],
  ["Лк", 6, 31, 31],
  ["Быт", 1, 1, 1],
  ["Ин", 8, 12, 12],
  ["Пс", 118, 105, 105],
  ["Мф", 28, 20, 20],
  ["Ин", 15, 12, 12],
  ["Притч", 15, 1, 1],
];

const SURNAMES: readonly (readonly [string, string])[] = [
  ["Иванов", "Иванова"], ["Петров", "Петрова"], ["Сидоров", "Сидорова"], ["Козлов", "Козлова"],
  ["Новиков", "Новикова"], ["Морозов", "Морозова"], ["Волков", "Волкова"], ["Соколов", "Соколова"],
  ["Лебедев", "Лебедева"], ["Попов", "Попова"], ["Фёдоров", "Фёдорова"], ["Орлов", "Орлова"],
  ["Макаров", "Макарова"], ["Никитин", "Никитина"], ["Захаров", "Захарова"], ["Зайцев", "Зайцева"],
  ["Борисов", "Борисова"], ["Яковлев", "Яковлева"], ["Григорьев", "Григорьева"], ["Романов", "Романова"],
  ["Воробьёв", "Воробьёва"], ["Сергеев", "Сергеева"], ["Кузьмин", "Кузьмина"], ["Фролов", "Фролова"],
];
const MALE_NAMES = ["Артём", "Даниил", "Михаил", "Матвей", "Тимофей", "Иван", "Фёдор", "Никита", "Егор", "Лев", "Степан", "Роман"];
const FEMALE_NAMES = ["Анна", "София", "Мария", "Алиса", "Полина", "Варвара", "Ева", "Ксения", "Вера", "Дарья", "Таисия", "Милана"];

/** Cohort sizes. Active-year headcount is fixed in `buildEnrollments`, not by these numbers alone. */
const COHORT = { A: 30, B: 20, C: 16, N: 12, P: 18, U: 4 } as const;

const YEARS: readonly FixtureYear[] = [
  {
    key: YEAR_KEY.Y1,
    name: "2024–2025",
    startsOn: "2024-09-01",
    endsOn: "2025-05-31",
    status: ACADEMIC_YEAR_STATUS.CLOSED,
    lessonDates: stepSundays("2024-09-08", 14, 10),
    reviewIndexes: [4, 9],
  },
  {
    key: YEAR_KEY.Y2,
    name: "2025–2026",
    startsOn: "2025-09-01",
    endsOn: "2026-05-31",
    status: ACADEMIC_YEAR_STATUS.CLOSED,
    lessonDates: stepSundays("2025-09-07", 14, 10),
    reviewIndexes: [4, 9],
  },
  {
    key: YEAR_KEY.Y3,
    name: "2026–2027",
    startsOn: "2026-09-01",
    endsOn: "2027-05-31",
    status: ACADEMIC_YEAR_STATUS.ACTIVE,
    lessonDates: stepSundays("2026-09-06", 7, 5),
    reviewIndexes: [],
  },
];

function stepSundays(first: string, stepDays: number, count: number): string[] {
  const start = Date.parse(`${first}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) =>
    new Date(start + i * stepDays * 86_400_000).toISOString().slice(0, 10),
  );
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** UUID derived from a name (v5-style, fixed namespace): the same fixture row always gets the same id. */
export function deterministicUuid(name: string): string {
  const hex = createHash("sha1").update(`sunschool-dev-fixture:${name}`).digest("hex");
  const variant = ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

function birthDateFor(key: string): string {
  const number = Number(key.replace(/\D/g, "")) || 1;
  const prefix = key[0] ?? "u";
  let base = "2016-04-01";
  if (prefix === "a" || prefix === "n") base = "2018-04-01";
  else if (prefix === "b") base = "2015-04-01";
  else if (prefix === "c") base = "2012-04-01";
  else if (prefix === "p") base = number <= 10 ? "2018-04-01" : number <= 15 ? "2015-04-01" : "2012-04-01";
  const start = Date.parse(`${base}T00:00:00Z`);
  return new Date(start + (number % 300) * 86_400_000).toISOString().slice(0, 10);
}

function signedOnFor(key: string): string | null {
  if (key === "a1" || key === "u3") return null;
  if (key.startsWith("u")) return "2026-09-01";
  if (key.startsWith("n")) return "2025-08-30";
  if (key.startsWith("p")) return "2026-08-30";
  return "2024-08-25";
}

function consentFor(key: string): FixturePupilConsent {
  if (key === "a1") return FIXTURE_PUPIL_CONSENT.LEGACY_PENDING;
  if (key === "u3") return FIXTURE_PUPIL_CONSENT.NONE;
  return FIXTURE_PUPIL_CONSENT.PAPER;
}

function buildPupils(rng: () => number): FixturePupil[] {
  const pupils: FixturePupil[] = [];
  const add = (prefix: string, count: number): void => {
    for (let i = 0; i < count; i += 1) {
      const index = pupils.length;
      const key = `${prefix}${i + 1}`;
      const female = index % 2 === 1;
      const surname = SURNAMES[Math.floor(index / 2) % SURNAMES.length]!;
      pupils.push({
        key,
        lastName: female ? surname[1] : surname[0],
        firstName: (female ? FEMALE_NAMES : MALE_NAMES)[Math.floor(index / 2) % 12]!,
        birthDate: birthDateFor(key),
        isActive: key !== "u4",
        attendance: clamp(0.62 + rng() * 0.36, 0.55, 0.98),
        skill: clamp(0.5 + (rng() - 0.35) * 0.55, 0.2, 0.95),
        signedOn: signedOnFor(key),
        consent: consentFor(key),
      });
    }
  };
  add("a", COHORT.A);
  add("b", COHORT.B);
  add("c", COHORT.C);
  add("n", COHORT.N);
  add("p", COHORT.P);
  add("u", COHORT.U);
  const lowAttendance = [0.35, 0.32, 0.28, 0.4];
  LOW_ATTENDANCE_KEYS.forEach((key, index) => {
    const pupil = pupils.find((row) => row.key === key);
    if (pupil) pupil.attendance = lowAttendance[index]!;
  });
  return pupils;
}

function buildEnrollments(): FixtureEnrollment[] {
  const y1 = YEARS[0]!;
  const y2 = YEARS[1]!;
  const y3 = YEARS[2]!;
  const rows: FixtureEnrollment[] = [];
  const closed = (pupilKey: string, gradeKey: GradeKey, year: FixtureYear, startsOn = year.startsOn, endsOn = year.endsOn) =>
    rows.push({ pupilKey, gradeKey, yearKey: year.key, startsOn, endsOn });
  const open = (pupilKey: string, gradeKey: GradeKey) =>
    rows.push({ pupilKey, gradeKey, yearKey: y3.key, startsOn: y3.startsOn, endsOn: null });
  const keys = (prefix: string, from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => `${prefix}${from + i}`);

  for (const key of keys("a", 1, COHORT.A)) closed(key, GRADE_KEY.JUNIOR, y1);
  for (const key of keys("b", 1, COHORT.B)) closed(key, GRADE_KEY.MIDDLE, y1);
  for (const key of keys("c", 1, COHORT.C)) closed(key, GRADE_KEY.SENIOR, y1);

  // 2025–2026. a19–a21 and b15–b17 spend the year in two groups (move after lesson 5).
  const midYear = y2.lessonDates[4]!;
  const afterMid = y2.lessonDates[5]!;
  for (const key of keys("a", 1, 18)) closed(key, GRADE_KEY.JUNIOR, y2);
  for (const key of keys("a", 19, 21)) {
    closed(key, GRADE_KEY.JUNIOR, y2, y2.startsOn, midYear);
    closed(key, GRADE_KEY.MIDDLE, y2, afterMid, y2.endsOn);
  }
  for (const key of keys("a", 22, 28)) closed(key, GRADE_KEY.MIDDLE, y2);
  for (const key of keys("b", 1, 14)) closed(key, GRADE_KEY.MIDDLE, y2);
  for (const key of keys("b", 15, 17)) {
    closed(key, GRADE_KEY.MIDDLE, y2, y2.startsOn, midYear);
    closed(key, GRADE_KEY.SENIOR, y2, afterMid, y2.endsOn);
  }
  for (const key of keys("b", 18, 20)) closed(key, GRADE_KEY.SENIOR, y2);
  for (const key of keys("c", 1, 14)) closed(key, GRADE_KEY.SENIOR, y2);
  for (const key of keys("n", 1, 10)) closed(key, GRADE_KEY.JUNIOR, y2);
  for (const key of keys("n", 11, 12)) closed(key, GRADE_KEY.JUNIOR, y2, y2.lessonDates[7]!);

  // 2026–2027: 30 open enrollments in each group. a29–a30, c15–c16 and n11–n12 do not return.
  for (const key of [...keys("a", 1, 12), ...keys("n", 1, 8), ...keys("p", 1, 10)]) open(key, GRADE_KEY.JUNIOR);
  for (const key of [...keys("a", 13, 18), ...keys("a", 22, 28), ...keys("b", 1, 10), ...keys("n", 9, 10), ...keys("p", 11, 15)]) {
    open(key, GRADE_KEY.MIDDLE);
  }
  for (const key of [...keys("a", 19, 21), ...keys("b", 11, 20), ...keys("c", 1, 14), ...keys("p", 16, 18)]) {
    open(key, GRADE_KEY.SENIOR);
  }
  return rows;
}

export function fixtureLessonName(lesson: Pick<FixtureLesson, "gradeKey" | "yearKey" | "index">): string {
  return `${lesson.gradeKey}:${lesson.yearKey}:${lesson.index}`;
}

const covers = (row: FixtureEnrollment, date: string): boolean =>
  row.startsOn <= date && (row.endsOn === null || date <= row.endsOn);

export function buildFixture(): Fixture {
  const rng = mulberry32(20261019);
  const pupils = buildPupils(rng);
  const enrollments = buildEnrollments();
  const snapshot = buildScoringSnapshot({
    useVerses: true,
    useTest: true,
    useNotebook: true,
    useSinging: true,
    maxVersesPerLesson: SETTINGS_MAX_VERSES,
    weights: defaultGradeScoreWeights(),
  });
  const weights = defaultGradeScoreWeights();

  const lessons: FixtureLesson[] = [];
  const checks: FixtureCheck[] = [];
  let verseCursor = 0;

  for (const year of YEARS) {
    for (const gradeKey of Object.values(GRADE_KEY)) {
      let previousRegular: FixtureLesson | null = null;
      year.lessonDates.forEach((date, index) => {
        const isReview = year.reviewIndexes.includes(index);
        const isHeld = year.status === ACADEMIC_YEAR_STATUS.ACTIVE && index === year.lessonDates.length - 1;
        const verseIndexes = isReview
          ? []
          : Array.from({ length: MAX_VERSES_PER_LESSON }, () => verseCursor++ % GOLDEN_VERSES.length);
        const lesson: FixtureLesson = {
          gradeKey,
          yearKey: year.key,
          index,
          title: isReview ? `Повторение ${index + 1}` : `Урок ${index + 1}`,
          date,
          kind: isReview ? LESSON_KIND.REVIEW : LESSON_KIND.REGULAR,
          hasTest: !isReview && index % 3 === 1,
          status: isHeld ? LESSON_STATUS.HELD : LESSON_STATUS.CHECK_COMPLETED,
          verseIndexes,
        };
        lessons.push(lesson);

        const covered = enrollments.filter(
          (row) => row.gradeKey === gradeKey && row.yearKey === year.key && covers(row, date),
        );
        const checkedKeys = isHeld
          ? new Set(covered.map((row) => row.pupilKey).sort().slice(0, HELD_LESSON_CHECKED_COUNT))
          : null;
        const versesToRecite = previousRegular?.verseIndexes ?? [];
        const yearShift = year.key === YEAR_KEY.Y1 ? -0.06 : year.key === YEAR_KEY.Y2 ? 0 : 0.04;
        const groupShift = gradeKey === GRADE_KEY.JUNIOR ? -0.04 : gradeKey === GRADE_KEY.SENIOR ? 0.04 : 0;
        for (const enrollment of covered) {
          if (checkedKeys && !checkedKeys.has(enrollment.pupilKey)) continue;
          const pupil = pupils.find((row) => row.key === enrollment.pupilKey)!;
          const present = rng() < pupil.attendance;
          const level = clamp(pupil.skill + yearShift + groupShift, 0.1, 0.97);
          const score = (max: number): number => clamp(Math.round((level + (rng() - 0.5) * 0.4) * max), 0, max);
          const verseScores = present && !isReview ? versesToRecite.map(() => score(2)) : [];
          const testScore = present && lesson.hasTest ? score(10) : null;
          const notebookScore = present ? score(10) : null;
          const singing = present && rng() < 0.7;
          checks.push({
            gradeKey,
            yearKey: year.key,
            lessonIndex: index,
            pupilKey: pupil.key,
            present,
            late: present && rng() < 0.06,
            testScore,
            notebookScore,
            singing,
            verseScores,
            pointsTotal: computePoints(
              lesson.kind,
              { verseScores, testScore, notebookScore, singing },
              weights,
              snapshot.switches,
            ),
            scoringSnapshot: snapshot,
          });
        }
        if (!isReview) previousRegular = lesson;
      });
    }
  }

  ensureLateChecks(checks, lessons);
  return { years: [...YEARS], pupils, enrollments, lessons, checks, bricks: buildBricks(checks, enrollments, rng) };
}

/** The PRNG rarely marks a check late; top up to a stable handful on completed lessons. */
function ensureLateChecks(checks: FixtureCheck[], lessons: FixtureLesson[]): void {
  let lateCount = checks.filter((row) => row.late).length;
  for (const check of checks) {
    if (lateCount >= LATE_CHECK_TARGET) return;
    if (!check.present || check.late) continue;
    const lesson = lessons.find(
      (row) => row.gradeKey === check.gradeKey && row.yearKey === check.yearKey && row.index === check.lessonIndex,
    );
    if (lesson?.status !== LESSON_STATUS.CHECK_COMPLETED) continue;
    check.late = true;
    lateCount += 1;
  }
}

/**
 * Brick ledger: the balance (earned points − issued bricks) stays non-negative. Closed years get two
 * issues and at least one compensating negative row; the open year gets one small issue.
 */
function buildBricks(checks: FixtureCheck[], enrollments: FixtureEnrollment[], rng: () => number): FixtureBrick[] {
  const earned = new Map<string, { total: number; gradeKey: GradeKey }>();
  for (const check of checks) {
    const key = `${check.pupilKey}|${check.yearKey}`;
    const entry = earned.get(key) ?? { total: 0, gradeKey: check.gradeKey };
    entry.total += check.pointsTotal;
    entry.gradeKey = check.gradeKey;
    earned.set(key, entry);
  }
  const bricks: FixtureBrick[] = [];
  let compensated = 0;
  for (const [key, { total, gradeKey }] of earned) {
    const [pupilKey, yearKey] = key.split("|") as [string, YearKey];
    const year = YEARS.find((row) => row.key === yearKey)!;
    const lastLesson = year.lessonDates[year.lessonDates.length - 1]!;
    if (!enrollments.some((row) => row.pupilKey === pupilKey && row.yearKey === yearKey)) continue;
    if (year.status === ACADEMIC_YEAR_STATUS.ACTIVE) {
      const quantity = Math.min(total, 3 + Math.floor(rng() * 4));
      if (quantity > 0) bricks.push({ pupilKey, yearKey, gradeKey, quantity, issuedOn: lastLesson, note: null });
      continue;
    }
    const first = Math.floor(total * 0.4);
    const second = Math.floor(total * 0.25);
    if (first > 0) bricks.push({ pupilKey, yearKey, gradeKey, quantity: first, issuedOn: year.lessonDates[4]!, note: null });
    if (second > 0) bricks.push({ pupilKey, yearKey, gradeKey, quantity: second, issuedOn: lastLesson, note: null });
    if (first > 3 && compensated < 3 && rng() < 0.25) {
      compensated += 1;
      bricks.push({
        pupilKey,
        yearKey,
        gradeKey,
        quantity: -2,
        issuedOn: lastLesson,
        note: "Исправление ошибочной выдачи",
      });
    }
  }
  if (!bricks.some((row) => row.quantity < 0)) {
    const host = bricks.find((row) => row.quantity > 4 && YEARS.find((year) => year.key === row.yearKey)?.status === ACADEMIC_YEAR_STATUS.CLOSED);
    if (host) {
      bricks.push({ ...host, quantity: -2, note: "Исправление ошибочной выдачи" });
    }
  }
  return bricks;
}
