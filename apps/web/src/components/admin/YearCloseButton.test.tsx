/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YearCloseButton } from "@/components/admin/YearCloseButton";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";

const confirmDialogProps = vi.hoisted(() => ({ last: {} as { confirmPhrase?: string } }));

vi.mock("@/components/patterns/ConfirmDialog", () => ({
  ConfirmDialog: (props: { trigger: React.ReactNode; confirmPhrase?: string }) => {
    confirmDialogProps.last = props;
    return props.trigger;
  },
}));

const adminMessages = {
  year: {
    dangerZoneTitle: "Закрыть учебный год",
    dangerZoneCloseLead: "Это нельзя отменить",
    closeWillHappenTitle: "Что произойдёт",
    closeWillHappenItems: ["Только чтение", "Нельзя отменить", "Журнал сохранится"],
    closeConfirmTypeLabel: "Введите «{phrase}»",
    close: "Закрыть год",
    closeNamed: "Закрыть {period}",
    closeConfirmTitle: "Confirm",
    closeConfirmDescription: "Desc",
  },
  form: { cancel: "Отмена" },
} as unknown as Parameters<typeof AdminMessagesProvider>[0]["messages"];

describe("YearCloseButton", () => {
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

  const renderButton = (yearName: string) => {
    act(() => {
      root.render(
        <AdminMessagesProvider messages={adminMessages}>
          <YearCloseButton
            yearId="y1"
            yearName={yearName}
            pending={false}
            closeAction={() => {}}
            closeHint={{ term: "Закрыть год", hint: "Только чтение для учителей." }}
            closeReasonHint={{ term: "Причина (необязательно)", hint: "Попадёт в журнал" }}
          />
        </AdminMessagesProvider>,
      );
    });
    return container.textContent ?? "";
  };

  it("titles the section with the hint and names the period on the button", () => {
    const text = renderButton("2026–2027");
    expect(text).toContain("Закрыть учебный год");
    expect(text).toContain("Закрыть 2026–2027");
    expect(text).toContain("Причина (необязательно)");
    expect(container.querySelectorAll("button[aria-label]").length).toBe(2);
  });

  it("lists consequences and requires typing the period phrase (P29-T38)", () => {
    const text = renderButton("2026–2027");
    expect(text).toContain("Что произойдёт");
    expect(container.querySelectorAll("li").length).toBe(3);
    expect(text).toContain("Это нельзя отменить");
    expect(confirmDialogProps.last.confirmPhrase).toBe("закрыть 2026–2027");
  });

  it("falls back to the generic phrase without a period (P29-T38)", () => {
    renderButton("  ");
    expect(confirmDialogProps.last.confirmPhrase).toBe("закрыть год");
  });

  it("does not duplicate the «Закрыть год» label and falls back without a period", () => {
    const text = renderButton("  ");
    expect(text.match(/Закрыть год/g)?.length).toBe(1);
    expect(text).not.toContain("{period}");
  });
});
