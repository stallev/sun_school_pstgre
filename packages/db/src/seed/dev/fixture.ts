/**
 * Pure fixture for `db:seed:dev` (seed_data_spec set D): two groups, three academic years, ~46 pupils.
 * No database access — everything is derived from a seeded PRNG, so the output is identical on every run.
 *
 * Years:   2024–2025 (closed, 10 lessons), 2025–2026 (closed, 10 lessons), 2026–2027 (active, 4 lessons).
 * Groups:  «Старшая 1» (teacher fixture, no login) and «Старшая 2» (teacher@example.com).
 * Flow:    cohort A starts in group 1; in 2025–2026 most of A moves to group 2 (three pupils mid-year);
 *          newcomers join each year. A pupil with two groups in one year has a row per group.
 */
import { createHash } from "node:crypto";
import {
  LESSON_KIND,
  buildScoringSnapshot,
  computePoints,
  defaultGradeScoreWeights,
  type LessonKind,
  type ScoringSnapshot,
} from "@sunschool/domain";

export const YEAR_KEY = { Y1: "y1", Y2: "y2", Y3: "y3" } as const;
export type YearKey = (typeof YEAR_KEY)[keyof typeof YEAR_KEY];
export const GRADE_KEY = { G1: "g1", G2: "g2" } as const;
export type GradeKey = (typeof GRADE_KEY)[keyof typeof GRADE_KEY];

export const MAX_VERSES_PER_LESSON = 2;
export const SETTINGS_MAX_VERSES = 3;

export type FixtureYear = {
  key: YearKey;
  name: string;
  startsOn: string;
  endsOn: string;
  status: "CLOSED" | "ACTIVE";
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
  signedOn: string;
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

/** Cohort sizes — see the header comment and the plan table. */
const COHORT = { A: 22, B: 10, N1: 9, N2: 5 } as const;

const YEARS: readonly FixtureYear[] = [
  {
    key: YEAR_KEY.Y1,
    name: "2024–2025",
    startsOn: "2024-09-01",
    endsOn: "2025-05-31",
    status: "CLOSED",
    lessonDates: stepSundays("2024-09-08", 14, 10),
    reviewIndexes: [4, 9],
  },
  {
    key: YEAR_KEY.Y2,
    name: "2025–2026",
    startsOn: "2025-09-01",
    endsOn: "2026-05-31",
    status: "CLOSED",
    lessonDates: stepSundays("2025-09-07", 14, 10),
    reviewIndexes: [4, 9],
  },
  {
    key: YEAR_KEY.Y3,
    name: "2026–2027",
    startsOn: "2026-09-01",
    endsOn: "2027-05-31",
    status: "ACTIVE",
    lessonDates: stepSundays("2026-09-06", 7, 4),
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

function buildPupils(rng: () => number): FixturePupil[] {
  const pupils: FixturePupil[] = [];
  const add = (prefix: string, count: number, signedOn: string): void => {
    for (let i = 0; i < count; i += 1) {
      const index = pupils.length;
      const female = index % 2 === 1;
      const surname = SURNAMES[index % SURNAMES.length]!;
      // Born 2014-11-01 … 2016-09-30 → 10–11 years old on the fixture's "today" (2026-10-19).
      const birthMs = Date.parse("2014-11-01T00:00:00Z") + Math.floor(rng() * 698) * 86_400_000;
      pupils.push({
        key: `${prefix}${i + 1}`,
        lastName: female ? surname[1] : surname[0],
        firstName: (female ? FEMALE_NAMES : MALE_NAMES)[(index * 5 + 3) % 12]!,
        birthDate: new Date(birthMs).toISOString().slice(0, 10),
        isActive: true,
        attendance: clamp(0.62 + rng() * 0.36, 0.55, 0.98),
        skill: clamp(0.5 + (rng() - 0.35) * 0.55, 0.2, 0.95),
        signedOn,
      });
    }
  };
  add("a", COHORT.A, "2024-08-25");
  add("b", COHORT.B, "2024-08-25");
  add("n", COHORT.N1, "2025-08-30");
  add("m", COHORT.N2, "2026-08-30");
  // Low attendance (sample layer B): four pupils of group 2 in the active year.
  for (const key of ["b3", "a12", "a16", "m5"]) {
    const pupil = pupils.find((row) => row.key === key);
    if (pupil) pupil.attendance = 0.3 + rng() * 0.15;
  }
  // One pupil who left after the fourth lesson of the active year (sample layer C).
  const left = pupils.find((row) => row.key === "a21");
  if (left) left.isActive = false;
  return pupils;
}

function buildEnrollments(): FixtureEnrollment[] {
  const y1 = YEARS[0]!;
  const y2 = YEARS[1]!;
  const y3 = YEARS[2]!;
  const rows: FixtureEnrollment[] = [];
  const closed = (pupilKey: string, gradeKey: GradeKey, year: FixtureYear, startsOn = year.startsOn, endsOn = year.endsOn) =>
    rows.push({ pupilKey, gradeKey, yearKey: year.key, startsOn, endsOn });
  const open = (pupilKey: string, gradeKey: GradeKey, startsOn = y3.startsOn, endsOn: string | null = null) =>
    rows.push({ pupilKey, gradeKey, yearKey: y3.key, startsOn, endsOn });
  const a = (n: number) => `a${n}`;
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

  // 2024–2025: A → group 1, B → group 2.
  for (const n of range(1, COHORT.A)) closed(a(n), GRADE_KEY.G1, y1);
  for (const n of range(1, COHORT.B)) closed(`b${n}`, GRADE_KEY.G2, y1);

  // 2025–2026: A1–A5 stay in group 1; A6–A8 move to group 2 after the fifth lesson; A9–A22 move at the start.
  for (const n of range(1, 5)) closed(a(n), GRADE_KEY.G1, y2);
  const midYear = y2.lessonDates[4]!;
  const afterMid = y2.lessonDates[5]!;
  for (const n of range(6, 8)) {
    closed(a(n), GRADE_KEY.G1, y2, y2.startsOn, midYear);
    closed(a(n), GRADE_KEY.G2, y2, afterMid, y2.endsOn);
  }
  for (const n of range(9, COHORT.A)) closed(a(n), GRADE_KEY.G2, y2);
  for (const n of range(1, COHORT.B)) closed(`b${n}`, GRADE_KEY.G2, y2);
  // Newcomers of group 1: five at the start, four late (they have fewer than M=4 lessons).
  for (const n of range(1, 5)) closed(`n${n}`, GRADE_KEY.G1, y2);
  for (const n of range(6, COHORT.N1)) closed(`n${n}`, GRADE_KEY.G1, y2, y2.lessonDates[7]!);

  // 2026–2027 (open): group 1 = A1–A5 + N1–N5; group 2 = B1–B10 + A6–A19 + A21 (left after lesson 4) + M1–M5 = 30.
  for (const n of range(1, 5)) open(a(n), GRADE_KEY.G1);
  for (const n of range(1, 5)) open(`n${n}`, GRADE_KEY.G1);
  for (const n of range(1, COHORT.B)) open(`b${n}`, GRADE_KEY.G2);
  for (const n of range(6, 19)) open(a(n), GRADE_KEY.G2);
  open(a(21), GRADE_KEY.G2, y3.startsOn, y3.lessonDates[3]!);
  for (const n of range(1, COHORT.N2)) open(`m${n}`, GRADE_KEY.G2);
  // A20 and A22 leave after 2025–2026.
  return rows;
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
    for (const gradeKey of [GRADE_KEY.G1, GRADE_KEY.G2]) {
      let previousRegular: FixtureLesson | null = null;
      year.lessonDates.forEach((date, index) => {
        const isReview = year.reviewIndexes.includes(index);
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
          verseIndexes,
        };
        lessons.push(lesson);

        const versesToRecite = previousRegular?.verseIndexes ?? [];
        // Level drifts a little from year to year: the comparison between years has something to show.
        const yearShift = year.key === YEAR_KEY.Y1 ? -0.06 : year.key === YEAR_KEY.Y2 ? 0 : 0.04;
        const groupShift = gradeKey === GRADE_KEY.G1 ? -0.04 : 0.02;
        for (const enrollment of enrollments) {
          if (enrollment.gradeKey !== gradeKey || enrollment.yearKey !== year.key || !covers(enrollment, date)) continue;
          const pupil = pupils.find((row) => row.key === enrollment.pupilKey)!;
          const present = rng() < pupil.attendance;
          const level = clamp(pupil.skill + yearShift + groupShift, 0.1, 0.97);
          const score = (max: number): number => clamp(Math.round((level + (rng() - 0.5) * 0.4) * max), 0, max);
          const verseScores = present && !isReview ? versesToRecite.map(() => score(2)) : [];
          const testScore = present && lesson.hasTest ? score(10) : null;
          const notebookScore = present ? score(10) : null;
          const singing = present && rng() < 0.7;
          const late = present && rng() < 0.04;
          checks.push({
            gradeKey,
            yearKey: year.key,
            lessonIndex: index,
            pupilKey: pupil.key,
            present,
            late,
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

  return { years: [...YEARS], pupils, enrollments, lessons, checks, bricks: buildBricks(checks, enrollments, rng) };
}

/**
 * Brick ledger: the balance (earned points − issued bricks) stays non-negative. Closed years get two
 * issues and, for a few pupils, one compensating negative row; the open year gets one small issue.
 */
function buildBricks(checks: FixtureCheck[], enrollments: FixtureEnrollment[], rng: () => number): FixtureBrick[] {
  const earned = new Map<string, { total: number; gradeKey: GradeKey }>();
  for (const check of checks) {
    const key = `${check.pupilKey}|${check.yearKey}`;
    const entry = earned.get(key) ?? { total: 0, gradeKey: check.gradeKey };
    entry.total += check.pointsTotal;
    entry.gradeKey = check.gradeKey; // the last group of the year issues the bricks
    earned.set(key, entry);
  }
  const bricks: FixtureBrick[] = [];
  let compensated = 0;
  for (const [key, { total, gradeKey }] of earned) {
    const [pupilKey, yearKey] = key.split("|") as [string, YearKey];
    const year = YEARS.find((row) => row.key === yearKey)!;
    const lastLesson = year.lessonDates[year.lessonDates.length - 1]!;
    if (!enrollments.some((row) => row.pupilKey === pupilKey && row.yearKey === yearKey)) continue;
    if (year.status === "ACTIVE") {
      const quantity = Math.min(total, 3 + Math.floor(rng() * 4));
      if (quantity > 0) bricks.push({ pupilKey, yearKey, gradeKey, quantity, issuedOn: lastLesson, note: null });
      continue;
    }
    const first = Math.floor(total * 0.4);
    const second = Math.floor(total * 0.25);
    if (first > 0) {
      bricks.push({ pupilKey, yearKey, gradeKey, quantity: first, issuedOn: year.lessonDates[4]!, note: null });
    }
    if (second > 0) bricks.push({ pupilKey, yearKey, gradeKey, quantity: second, issuedOn: lastLesson, note: null });
    if (first > 3 && compensated < 3 && rng() < 0.2) {
      compensated += 1;
      bricks.push({ pupilKey, yearKey, gradeKey, quantity: -2, issuedOn: lastLesson, note: "Исправление ошибочной выдачи" });
    }
  }
  return bricks;
}
