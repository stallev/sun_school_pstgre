/**
 * @vitest-environment happy-dom
 *
 * P24 §5.5 / §5.7 / R-11…R-13: present error reset, unsaved dialog branches, keyboard guard.
 */
import { buildScoringSnapshot, LESSON_KIND, LESSON_STATUS } from "@sunschool/domain";
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shouldIgnoreSequentialCheckGlobalKeydown } from "@/components/teacher/sequential-check-keyboard";
import { CheckUnsavedDialog } from "@/components/teacher/CheckUnsavedDialog.client";
import { useSequentialCheck } from "@/components/teacher/use-sequential-check";
import commonRu from "@/lib/messages/ru/common.json";
import teacherRu from "@/lib/messages/ru/teacher.json";
import { pickTeacherCheckMessages } from "@/lib/messages/pick-teacher-check-messages.server";

const harness = vi.hoisted(() => ({
  saveCheckedAction: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: harness.refresh, push: harness.push }),
}));

vi.mock("@/actions/checks", () => ({
  saveCheckedAction: (...args: unknown[]) => harness.saveCheckedAction(...args),
  correctCheckAction: vi.fn(),
  completeLessonCheckAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const messages = pickTeacherCheckMessages(teacherRu, commonRu);

const pupilRow = (id: string, name: string) => ({
  pupilId: id,
  displayName: name,
  birthYear: 2015,
  addedLater: false,
  checkId: "check-1",
  present: true,
  homeworkChecked: false,
  testScore: null as number | null,
  notebookScore: null as number | null,
  singing: false,
  comment: "",
  late: false,
  pointsTotal: null as number | null,
  updatedAt: "2026-01-01T00:00:00.000Z",
  verseScores: {} as Record<string, number | null>,
});

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
  versesToRecite: [] as const,
  scoring: buildScoringSnapshot({
    useVerses: false,
    useTest: true,
    useNotebook: true,
    useSinging: false,
    maxVersesPerLesson: 0,
    weights: { verses: 0, test: 1, notebook: 1, singing: 0 },
  }),
  pupils: [
    { ...pupilRow("pupil-1", "Alex"), present: null },
    pupilRow("pupil-2", "Blake"),
  ],
};

type HookSnapshot = ReturnType<typeof useSequentialCheck>;

const SequentialCheckHarness = ({
  onReady,
}: {
  onReady: (api: HookSnapshot) => void;
}) => {
  const api = useSequentialCheck({
    data: pageData,
    initialPupilId: "pupil-1",
    messages,
    dictionaries: { teacher: teacherRu, common: commonRu },
  });

  useEffect(() => {
    onReady(api);
  }, [api, onReady]);

  const {
    headingRef,
    activePupil,
    unsavedDialogOpen,
    pending,
    presentError,
    unsavedDialogFinalFocus,
    handleUnsavedDialogOpenChange,
    handleUnsavedDialogOpenChangeComplete,
    handleUnsavedSave,
    handleUnsavedDiscard,
  } = api;

  return (
    <>
      <h2 ref={headingRef} tabIndex={-1}>
        {activePupil?.displayName ?? ""}
      </h2>
      <CheckUnsavedDialog
        open={unsavedDialogOpen}
        pupilName={activePupil?.displayName ?? ""}
        pending={pending}
        messages={messages}
        onOpenChange={handleUnsavedDialogOpenChange}
        onOpenChangeComplete={handleUnsavedDialogOpenChangeComplete}
        finalFocus={unsavedDialogFinalFocus}
        onSave={handleUnsavedSave}
        onDiscard={handleUnsavedDiscard}
      />
      <div data-active={activePupil?.pupilId} data-present-error={presentError ?? ""} />
    </>
  );
};

describe("useSequentialCheck P24", () => {
  let container: HTMLDivElement;
  let root: Root;
  let api: HookSnapshot | null = null;

  beforeEach(() => {
    harness.saveCheckedAction.mockReset();
    harness.refresh.mockReset();
    harness.push.mockReset();
    harness.saveCheckedAction.mockResolvedValue({
      ok: true,
      data: { updatedAt: "2026-01-02T00:00:00.000Z" },
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    api = null;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const mount = async () => {
    await act(async () => {
      root.render(
        <SequentialCheckHarness
          onReady={(next) => {
            api = next;
          }}
        />,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });
  };

  it("clears present error when presence is chosen", async () => {
    await mount();
    await act(async () => {
      api!.updateActive({ presentChoice: null });
    });
    await act(async () => {
      api!.handleSave();
    });
    expect(api!.presentError).toBeTruthy();

    await act(async () => {
      api!.updateActive({ presentChoice: true });
    });
    expect(api!.presentError).toBeUndefined();
  });

  it("clears present error when switching pupil without dirty state", async () => {
    await mount();
    await act(async () => {
      api!.handleSave();
    });
    expect(api!.presentError).toBeTruthy();

    await act(async () => {
      api!.moveTo("pupil-2");
    });
    expect(api!.activePupil?.pupilId).toBe("pupil-2");
    expect(api!.presentError).toBeUndefined();
  });

  it("does not save on Enter when focus is on a button", async () => {
    await mount();
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();

    await act(async () => {
      button.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      );
    });

    expect(harness.saveCheckedAction).not.toHaveBeenCalled();
    button.remove();
  });

  it("opens unsaved dialog and discards changes on discard", async () => {
    await mount();
    await act(async () => {
      api!.updateActive({ testScore: 8 });
    });

    await act(async () => {
      api!.moveTo("pupil-2");
    });
    expect(api!.unsavedDialogOpen).toBe(true);
    expect(api!.activePupil?.pupilId).toBe("pupil-1");

    await act(async () => {
      api!.handleUnsavedDiscard();
    });

    expect(api!.unsavedDialogOpen).toBe(false);
    expect(api!.activePupil?.pupilId).toBe("pupil-2");
    expect(api!.activePupil?.testScore).toBeNull();
  });

  it("ignores arrow keys inside radiogroup", () => {
    const radiogroup = document.createElement("div");
    radiogroup.setAttribute("role", "radiogroup");
    const radio = document.createElement("button");
    radio.setAttribute("role", "radio");
    radiogroup.appendChild(radio);
    document.body.appendChild(radiogroup);

    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, "target", { value: radio });

    expect(shouldIgnoreSequentialCheckGlobalKeydown(event)).toBe(true);
    radiogroup.remove();
  });

  it("focuses pupil heading after successful save from unsaved dialog", async () => {
    await mount();
    const navButton = document.createElement("button");
    document.body.appendChild(navButton);
    navButton.focus();

    await act(async () => {
      api!.updateActive({ presentChoice: true, testScore: 8 });
    });
    await act(async () => {
      api!.moveTo("pupil-2");
    });
    expect(api!.unsavedDialogOpen).toBe(true);

    await act(async () => {
      api!.handleUnsavedSave();
      await Promise.resolve();
    });
    await act(async () => {
      api!.handleUnsavedDialogOpenChangeComplete(false);
    });

    expect(document.activeElement).toBe(api!.headingRef.current);
    expect(navButton).not.toBe(document.activeElement);
    navButton.remove();
  });

  it("closes unsaved dialog when save rejects", async () => {
    harness.saveCheckedAction.mockRejectedValueOnce(new Error("network"));
    await mount();
    await act(async () => {
      api!.updateActive({ presentChoice: true, testScore: 8 });
    });
    await act(async () => {
      api!.moveTo("pupil-2");
    });
    expect(api!.unsavedDialogOpen).toBe(true);

    await act(async () => {
      api!.handleUnsavedSave();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(api!.unsavedDialogOpen).toBe(false);
    expect(api!.activePupil?.pupilId).toBe("pupil-1");
  });

  it("opens unsaved dialog on internal link click when dirty", async () => {
    await mount();
    const link = document.createElement("a");
    link.href = "/group";
    link.textContent = "Group";
    document.body.appendChild(link);

    await act(async () => {
      api!.updateActive({ testScore: 5 });
    });

    await act(async () => {
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });

    expect(api!.unsavedDialogOpen).toBe(true);
    expect(api!.activePupil?.pupilId).toBe("pupil-1");
    link.remove();
  });
});
