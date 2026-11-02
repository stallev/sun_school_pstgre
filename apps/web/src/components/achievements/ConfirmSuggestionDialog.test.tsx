/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const confirmMock = vi.fn();
const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("@/actions/teacher-achievements", () => ({
  confirmAchievementSuggestionAction: (...args: unknown[]) => confirmMock(...args),
  deferAchievementSuggestionAction: vi.fn(),
  dismissAchievementSuggestionAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: (...a: unknown[]) => toastSuccess(...a) } }));

import { ConfirmSuggestionDialog } from "@/components/achievements/ConfirmSuggestionDialog.client";
import type { PupilSuggestionRow } from "@/lib/achievements/pupil-achievement-panel-types";
import type { TeacherSuggestionMessages } from "@/lib/messages/teacher-suggestion-messages";

const messages: TeacherSuggestionMessages = {
  title: "T", deferredTemplate: "d {date}", confirmButton: "Open", dialogTitle: "Confirm achievement",
  introForms: { other: "{count} lessons" }, versesTitle: "Verses", versesEmpty: "No verses", textMissing: "Missing",
  confirm: "Confirm", confirming: "Confirming…", defer: "Defer", deferring: "Deferring…",
  dismiss: "Dismiss", dismissing: "Dismissing…", dismissTitle: "DT", dismissDescription: "DD",
  dismissReasonLabel: "Reason", dismissReasonPlaceholder: "", toastConfirmed: "Confirmed",
  toastDeferred: "Deferred", toastDismissed: "Dismissed", countLabel: "C", cancel: "Cancel", closeLabel: "Close",
};

const suggestion: PupilSuggestionRow = {
  suggestionId: "s1", achievementName: "Keeper", tier: 1, seriesLength: 3, deferredDateLabel: null,
  verses: [{ reference: "Jn 3:16", text: "For God so loved", dateLabel: "5 Oct" }], canAct: true,
};

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  confirmMock.mockReset();
  toastError.mockReset();
  toastSuccess.mockReset();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const renderDialog = (item: PupilSuggestionRow = suggestion) =>
  act(() => {
    root.render(
      <ConfirmSuggestionDialog
        open onOpenChange={vi.fn()} suggestion={item} pupilName="Ivan" tierLabel="Bronze" locale="en"
        messages={messages}
        dictionaries={{ teacher: { achievements: { suggestion_resolved: "Already resolved" } } }}
        formError="Form error"
      />,
    );
  });

const buttonByText = (text: string) =>
  [...document.body.querySelectorAll("button")].find((b) => b.textContent?.includes(text));

describe("ConfirmSuggestionDialog", () => {
  it("renders the series verses with text", () => {
    renderDialog();
    expect(document.body.textContent).toContain("Jn 3:16");
    expect(document.body.textContent).toContain("For God so loved");
  });

  it("shows the empty-list line when no verses restore", () => {
    renderDialog({ ...suggestion, verses: [] });
    expect(document.body.textContent).toContain("No verses");
    expect(buttonByText("Confirm")).toBeDefined();
  });

  it("disables buttons and shows a gerund while confirming", async () => {
    let resolve: (value: unknown) => void = () => undefined;
    confirmMock.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderDialog();
    await act(async () => { buttonByText("Confirm")?.click(); });
    const busy = buttonByText("Confirming…");
    expect(busy?.getAttribute("aria-busy")).toBe("true");
    expect(busy?.hasAttribute("disabled")).toBe(true);
    await act(async () => { resolve({ ok: true, data: {} }); });
    expect(toastSuccess).toHaveBeenCalledWith("Confirmed", { duration: 2000 });
  });

  it("shows toast.error with the dictionary message on a failed result", async () => {
    confirmMock.mockResolvedValue({
      ok: false, code: "ACHIEVEMENT_SUGGESTION_RESOLVED", message: "teacher.achievements.suggestion_resolved",
    });
    renderDialog();
    await act(async () => { buttonByText("Confirm")?.click(); });
    expect(toastError).toHaveBeenCalledWith("Already resolved", { duration: 2000 });
  });
});
