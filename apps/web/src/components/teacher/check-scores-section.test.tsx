/**
 * @vitest-environment happy-dom
 *
 * §5.3: «Был» clears a manual reveal, so the next «Не был» collapses the rubric again.
 */
import { LESSON_KIND } from "@sunschool/domain";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckScoresSection } from "@/components/teacher/CheckScoresSection";
import commonRu from "@/lib/messages/ru/common.json";
import teacherRu from "@/lib/messages/ru/teacher.json";
import { pickTeacherCheckMessages } from "@/lib/messages/pick-teacher-check-messages.server";

const messages = pickTeacherCheckMessages(teacherRu, commonRu);

const pupil = (presentChoice: boolean | null) => ({
  pupilId: "pupil-1",
  presentChoice,
  late: false,
  verseScores: { "verse-1": null },
  testScore: null,
  notebookScore: null,
});

describe("CheckScoresSection absent collapse", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("collapses again after present is chosen and then cleared", async () => {
    const render = (presentChoice: boolean | null) =>
      root.render(
        <CheckScoresSection
          pupil={pupil(presentChoice)}
          lessonKind={LESSON_KIND.REGULAR}
          hasTest
          versesToRecite={[{ lessonVerseId: "verse-1", position: 1 }]}
          previousLessonOrdinal={1}
          disabled={false}
          messages={messages}
          onVerseScoreChange={vi.fn()}
          onTestScoreChange={vi.fn()}
          onNotebookScoreChange={vi.fn()}
        />,
      );

    await act(async () => {
      render(false);
    });
    const showScores = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === messages.showScores,
    );
    expect(showScores).toBeTruthy();

    await act(async () => {
      showScores!.click();
    });
    expect(container.textContent).toContain(messages.testLabel);

    await act(async () => {
      render(true);
    });
    await act(async () => {
      render(false);
    });

    expect(container.textContent).toContain(messages.showScores);
    expect(container.textContent).not.toContain(messages.testLabel);
  });
});
