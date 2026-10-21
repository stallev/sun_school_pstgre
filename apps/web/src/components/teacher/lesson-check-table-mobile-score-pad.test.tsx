/**
 * @vitest-environment happy-dom
 *
 * H §7.2: one interactive score pad per field — dual CSS-hidden table + cards used to
 * mount two ScoreCells with the same openCellKey; hidden branch closed the pad on pointerdown.
 */
import { buildScoringSnapshot, LESSON_KIND, LESSON_STATUS } from "@sunschool/domain";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LessonCheckTable } from "@/components/teacher/LessonCheckTable";
import commonRu from "@/lib/messages/ru/common.json";
import teacherRu from "@/lib/messages/ru/teacher.json";
import { pickTeacherCheckMessages } from "@/lib/messages/pick-teacher-check-messages.server";

const harness = vi.hoisted(() => ({
  mdUp: false,
  conflictIds: new Set<string>(),
  mutateTestScore: vi.fn<(pupilId: string, score: number | null) => void>(),
  pupilRow: {
    pupilId: "pupil-1",
    displayName: "Alex Pupil",
    present: true,
    homeworkChecked: false,
    testScore: null as number | null,
    notebookScore: null as number | null,
    singing: false,
    late: false,
    pointsTotal: null as number | null,
    updatedAt: null as string | null,
    verseScores: {} as Record<string, number | null>,
  },
}));

vi.mock("@/components/teacher/use-lesson-check-table", () => ({
  useLessonCheckTable: () => ({
    rows: [harness.pupilRow],
    filterPresent: false,
    setFilterPresent: vi.fn(),
    filterUnchecked: false,
    setFilterUnchecked: vi.fn(),
    stats: { present: 1, unchecked: 1, checked: 0, total: 1 },
    resetFilters: vi.fn(),
    readOnly: false,
    busyCells: new Set<string>(),
    conflictIds: harness.conflictIds,
    pending: false,
    lessonCorrection: false,
    mutatePresent: vi.fn(),
    mutateSinging: vi.fn(),
    mutateTestScore: harness.mutateTestScore,
    mutateNotebookScore: vi.fn(),
    mutateVerseScore: vi.fn(),
  }),
}));

const messages = pickTeacherCheckMessages(teacherRu, commonRu);

const pageData = {
  kind: "page" as const,
  lessonId: "lesson-1",
  lessonOrdinal: 1,
  lessonTitle: "Lesson",
  lessonDateIso: "2026-01-01",
  lessonStatus: LESSON_STATUS.HELD,
  lessonKind: LESSON_KIND.REGULAR,
  hasTest: true,
  canMutate: true,
  yearClosed: false,
  isAdmin: false,
  checkedCount: 0,
  versesToRecite: [] as const,
  scoring: buildScoringSnapshot({
    useVerses: true,
    useTest: true,
    useNotebook: true,
    useSinging: true,
    maxVersesPerLesson: 1,
    weights: { verses: 1, test: 1, notebook: 1, singing: 1 },
  }),
  pupils: [harness.pupilRow],
};

describe("LessonCheckTable mobile score pad", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    harness.mdUp = false;
    harness.conflictIds = new Set<string>();
    harness.mutateTestScore.mockClear();
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query.includes("min-width: 768px") ? harness.mdUp : false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("choosing a digit on the cards test pad calls mutateTestScore (not closed before click)", async () => {
    await act(async () => {
      root.render(
        <LessonCheckTable data={pageData} lessonDateLabel="1 January" messages={messages} dictionaries={{}} />,
      );
    });

    expect(document.querySelector("table")).toBeNull();

    const testTrigger = document.querySelector<HTMLButtonElement>(
      `button[aria-label^="${messages.testLabel}:"]`,
    );
    expect(testTrigger).not.toBeNull();

    await act(async () => {
      testTrigger!.click();
    });

    const digitSeven = document.querySelector<HTMLButtonElement>('button[aria-label="7"]');
    expect(digitSeven).not.toBeNull();

    await act(async () => {
      digitSeven!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      digitSeven!.click();
    });

    expect(harness.mutateTestScore).toHaveBeenCalledTimes(1);
    expect(harness.mutateTestScore).toHaveBeenCalledWith("pupil-1", 7);
  });

  it("shows the conflict sentence on the desktop row", async () => {
    harness.mdUp = true;
    harness.conflictIds = new Set(["pupil-1"]);
    await act(async () => {
      root.render(
        <LessonCheckTable data={pageData} lessonDateLabel="1 January" messages={messages} dictionaries={{}} />,
      );
    });

    expect(document.querySelector("table")).not.toBeNull();
    expect(container.textContent).toContain(messages.conflictTitle);
  });
});
