/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckAwardDialog } from "@/components/teacher/CheckAwardDialog.client";
import commonRu from "@/lib/messages/ru/common.json";
import teacherRu from "@/lib/messages/ru/teacher.json";
import {
  ACTIVE_WORK_ACHIEVEMENT_CODE,
  WORSHIP_RECITAL_ACHIEVEMENT_CODE,
} from "@/lib/achievements/catalog-display";
import { pickTeacherAchievementsMessages } from "@/lib/messages/pick-teacher-achievements-messages.server";
import { pickTeacherCheckMessages } from "@/lib/messages/pick-teacher-check-messages.server";

vi.mock("@/actions/teacher-achievements", () => ({
  awardManuallyFormAction: vi.fn(),
}));

vi.mock("@/lib/admin/use-admin-form-mutation", () => ({
  useAdminFormMutation: () => {},
}));

const messages = pickTeacherCheckMessages(teacherRu, commonRu);
const achievementMessages = pickTeacherAchievementsMessages(teacherRu);

const awardOptions = [
  {
    achievementId: "ach-worship",
    code: WORSHIP_RECITAL_ACHIEVEMENT_CODE,
    tier: 1,
    name: "Стихотворение",
    catalogPoints: 5,
    maxPoints: 5,
  },
  {
    achievementId: "ach-active",
    code: ACTIVE_WORK_ACHIEVEMENT_CODE,
    tier: 1,
    name: "Активная работа",
    catalogPoints: 3,
    maxPoints: 3,
  },
] as const;

describe("CheckAwardDialog", () => {
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

  const renderDialog = () => {
    act(() => {
      root.render(
        <CheckAwardDialog
          open
          onOpenChange={() => {}}
          pupilId="pupil-1"
          pupilName="Иван"
          lessonSubtitle="Урок 3 · 15 января"
          lessonId="lesson-1"
          academicYearId="year-1"
          lessonDateIso="2026-01-15"
          lessonDateLabel="15 января"
          awardOptions={awardOptions}
          eventDate={{ locale: "ru", today: "2026-01-15", min: "2025-09-01" }}
          messages={messages}
          achievementMessages={achievementMessages}
          dictionaries={{ teacher: teacherRu, common: commonRu }}
          formError={messages.formError}
        />,
      );
    });
  };

  it("lists both check-lesson award codes", () => {
    renderDialog();
    const text = document.body.textContent ?? "";
    expect(text).toContain("Стихотворение");
    expect(text).toContain("Активная работа");
  });

  it("hides event date field for active work and shows lesson date caption", () => {
    renderDialog();
    const activeWorkRadio = document.body.querySelector(
      `input[value="${ACTIVE_WORK_ACHIEVEMENT_CODE}"]`,
    ) as HTMLInputElement | null;
    expect(activeWorkRadio).not.toBeNull();
    act(() => {
      activeWorkRadio!.click();
    });
    expect(document.body.textContent).toContain("15 января");
  });

  it("shows event date field for worship recital", () => {
    renderDialog();
    const worshipRadio = document.body.querySelector(
      `input[value="${WORSHIP_RECITAL_ACHIEVEMENT_CODE}"]`,
    ) as HTMLInputElement | null;
    expect(worshipRadio).not.toBeNull();
    act(() => {
      worshipRadio!.click();
    });
    expect(document.body.textContent).toContain(achievementMessages.awardEventDateLabel);
  });
});
