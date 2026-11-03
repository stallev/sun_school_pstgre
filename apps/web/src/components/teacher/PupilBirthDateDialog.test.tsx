/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PupilBirthDateDialog } from "./PupilBirthDateDialog.client";

vi.mock("@/actions/school-pupils", () => ({
  updatePupilBirthDateAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const messages = {
  birthDateButton: "Дата рождения",
  birthDateDialogTitle: "Дата рождения",
  birthDateDialogDescription: "Укажите дату",
  birthDateLabel: "Дата рождения",
  birthDateSubmit: "Сохранить",
  birthDateSaving: "Сохраняем…",
  birthDateToastSaved: "Сохранено",
} as never;

describe("PupilBirthDateDialog", () => {
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
    document.body.innerHTML = "";
  });

  it("renders the trigger when editing is allowed", async () => {
    await act(async () => {
      root.render(
        <PupilBirthDateDialog
          pupilId="11111111-1111-4111-8111-111111111111"
          birthDateIso={null}
          canEdit
          maxDateIso="2026-11-02"
          dateFieldCopy={{ locale: "ru", calendarAriaLabel: "Календарь" }}
          closeLabel="Закрыть"
          messages={messages}
          dictionaries={{ common: {}, teacher: {} }}
          formError="Ошибка"
        />,
      );
    });

    expect(container.textContent).toContain("Дата рождения");
  });

  it("renders nothing when editing is disabled", async () => {
    await act(async () => {
      root.render(
        <PupilBirthDateDialog
          pupilId="11111111-1111-4111-8111-111111111111"
          birthDateIso={null}
          canEdit={false}
          maxDateIso="2026-11-02"
          dateFieldCopy={{ locale: "ru", calendarAriaLabel: "Календарь" }}
          closeLabel="Закрыть"
          messages={messages}
          dictionaries={{ common: {}, teacher: {} }}
          formError="Ошибка"
        />,
      );
    });

    expect(container.textContent).toBe("");
  });
});
