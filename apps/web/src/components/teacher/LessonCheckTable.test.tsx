import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LESSON_KIND, LESSON_STATUS, buildScoringSnapshot } from "@sunschool/domain";
import { LessonCheckTable } from "@/components/teacher/LessonCheckTable";
import type { LessonTablePageData } from "@/data/checks/load-lesson-table-page.server";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";

vi.mock("@/components/teacher/use-lesson-check-table", () => ({
  useLessonCheckTable: () => ({
    stats: { present: 1, unchecked: 0, checked: 1, total: 1 },
    rows: [],
    filterPresent: false,
    filterUnchecked: false,
    pending: false,
    resetFilters: () => {},
    setFilterPresent: () => {},
    setFilterUnchecked: () => {},
    readOnly: true,
    busyCells: new Set<string>(),
    conflictIds: new Set<string>(),
    lessonCorrection: false,
  }),
}));

vi.mock("@/lib/ui/use-md-up", () => ({
  useMdUp: () => false,
}));

const messages = {
  tablePageTitle: "Таблица всех оценок",
  tableGroupMemory: "Стихи",
  tableGroupWork: "Тест и тетрадь",
  tableGroupTotal: "Баллы",
  linkLesson: "К уроку",
  tableLinkSequential: "Последовательная проверка",
  sheetOpen: "Печатная ведомость",
  sheetOpenAria: "Ведомость",
  emptyRosterTitle: "empty",
  emptyRosterDescription: "empty",
  emptyRosterAction: "empty",
  tableCountPresent: "были {count}",
  tableCountUnchecked: "не проверены {count}",
  tableProgressHeader: "Проверено {checked} из {total}",
  progressFraction: "{checked} из {total}",
  tableFilterAll: "Все",
  tableFilterPresent: "Были",
  tableFilterUnchecked: "Непроверенные",
  tableFootnote: "note",
} as TeacherCheckMessages;

const pageData: Extract<LessonTablePageData, { kind: "page" }> = {
  kind: "page",
  lessonId: "lesson-1",
  lessonOrdinal: 5,
  lessonTitle: "Урок 5",
  lessonDateIso: "2026-10-04",
  lessonStatus: LESSON_STATUS.HELD,
  lessonKind: LESSON_KIND.REGULAR,
  hasTest: true,
  canMutate: true,
  yearClosed: false,
  isAdmin: false,
  checkedCount: 1,
  versesToRecite: [],
  scoring: buildScoringSnapshot({
    useVerses: true,
    useTest: true,
    useNotebook: true,
    useSinging: true,
    maxVersesPerLesson: 3,
    weights: {},
  }),
  pupils: [
    {
      pupilId: "p1",
      displayName: "Иванов",
      present: true,
      homeworkChecked: true,
      testScore: 8,
      notebookScore: 9,
      singing: true,
      late: false,
      pointsTotal: 20,
      updatedAt: null,
      verseScores: {},
    },
  ],
};

describe("LessonCheckTable (P26-T6)", () => {
  it("uses unified table title and column group labels", () => {
    const html = renderToStaticMarkup(
      <LessonCheckTable
        data={pageData}
        lessonDescription="Урок 5 · 4 октября"
        messages={messages}
        dictionaries={{ teacher: {}, common: {} }}
      />,
    );

    expect(html).toContain("Таблица всех оценок");
    expect(html).toContain("Урок 5 · 4 октября");
    expect(html).not.toContain("Урок 5 · Урок 5");
  });
});
