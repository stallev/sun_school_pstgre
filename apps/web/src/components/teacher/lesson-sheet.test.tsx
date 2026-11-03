import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LESSON_KIND, LESSON_STATUS, buildScoringSnapshot } from "@sunschool/domain";
import { LessonSheet } from "@/components/teacher/LessonSheet";
import type { LessonTablePageData, LessonTablePupilRow } from "@/data/checks/load-lesson-table-page.server";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";

type PageData = Extract<LessonTablePageData, { kind: "page" }>;

const messages = new Proxy({} as TeacherCheckMessages, {
  get: (_target, key: string) => `[${key}]`,
});

const scoring = buildScoringSnapshot({
  useVerses: true,
  useTest: true,
  useNotebook: true,
  useSinging: true,
  maxVersesPerLesson: 3,
  weights: {},
});

const pupil = (pupilId: string, displayName: string, pointsTotal: number | null, checked = true): LessonTablePupilRow => ({
  pupilId,
  displayName,
  present: checked,
  homeworkChecked: checked,
  testScore: null,
  notebookScore: 8,
  singing: true,
  late: false,
  pointsTotal,
  updatedAt: null,
  verseScores: { v1: 2 },
});

const page = (overrides: Partial<PageData> = {}): PageData => ({
  kind: "page",
  lessonId: "lesson-1",
  lessonOrdinal: 7,
  lessonTitle: "Иосиф",
  lessonDateIso: "2026-10-18",
  lessonStatus: LESSON_STATUS.HELD,
  lessonKind: LESSON_KIND.REGULAR,
  hasTest: false,
  canMutate: true,
  yearClosed: false,
  isAdmin: false,
  checkedCount: 3,
  versesToRecite: [{ lessonVerseId: "v1", position: 1 }],
  scoring,
  pupils: [pupil("a", "Анна", 25), pupil("b", "Борис", 25), pupil("c", "Вера", 10), pupil("d", "Глеб", null, false)],
  ...overrides,
});

const render = (data: PageData) =>
  renderToStaticMarkup(<LessonSheet data={data} lessonDateLabel="18 октября" messages={messages} />);

const rowFor = (html: string, name: string) => html.split("<tr").find((chunk) => chunk.includes(name)) ?? "";

describe("LessonSheet (check flow §7.4)", () => {
  it("highlights every tied leader in gold with a text label, and nobody else", () => {
    const html = render(page());
    expect(rowFor(html, "Анна")).toContain("bg-gold-soft");
    expect(rowFor(html, "Борис")).toContain("bg-gold-soft");
    expect(rowFor(html, "Вера")).not.toContain("bg-gold-soft");
    expect(rowFor(html, "Глеб")).not.toContain("bg-gold-soft");
    expect(rowFor(html, "Анна")).toContain("[topScorer]");
  });

  it("sets the row count variable so the table fits one screen", () => {
    expect(render(page())).toContain("--sheet-rows:5");
  });

  it("renders a column per verse and the test column only when the lesson has a test", () => {
    const withoutTest = render(page());
    expect(withoutTest).toContain("[sheetVerseShort]");
    expect(withoutTest).not.toContain("[testLabel]");
    expect(render(page({ hasTest: true }))).toContain("[testLabel]");
  });

  it("has no verse or test columns on a review lesson", () => {
    const html = render(page({ lessonKind: LESSON_KIND.REVIEW, versesToRecite: [], hasTest: false }));
    expect(html).not.toContain("[sheetVerseShort]");
    expect(html).not.toContain("[testLabel]");
  });

  it("has no highlight without a checked pupil above zero", () => {
    const html = render(page({ pupils: [pupil("a", "Анна", 0), pupil("d", "Глеб", null, false)] }));
    expect(html).not.toContain("bg-gold-soft");
  });

  it("renders an empty state without pupils", () => {
    const html = render(page({ pupils: [] }));
    expect(html).toContain("[emptyRosterTitle]");
    expect(html).not.toContain("<table");
  });
});
