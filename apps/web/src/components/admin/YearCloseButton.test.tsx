/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YearCloseButton } from "@/components/admin/YearCloseButton";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";

vi.mock("@/components/patterns/ConfirmDialog", () => ({
  ConfirmDialog: ({ trigger }: { trigger: React.ReactNode }) => trigger,
}));

const adminMessages = {
  year: {
    dangerZoneTitle: "Опасная зона",
    dangerZoneCloseLead: "Lead",
    close: "Закрыть год",
    closeConfirmTitle: "Confirm",
    closeConfirmDescription: "Desc",
  },
  form: { cancel: "Отмена" },
} as Parameters<typeof AdminMessagesProvider>[0]["messages"];

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

  it("shows close hint term and reason hint near controls", () => {
    act(() => {
      root.render(
        <AdminMessagesProvider messages={adminMessages}>
          <YearCloseButton
            yearId="y1"
            pending={false}
            closeAction={() => {}}
            closeHint={{ term: "Закрыть год", hint: "Только чтение для учителей." }}
            closeReasonHint={{ term: "Причина (необязательно)", hint: "Попадёт в журнал" }}
          />
        </AdminMessagesProvider>,
      );
    });
    const text = container.textContent ?? "";
    expect(text).toContain("Закрыть год");
    expect(text).toContain("Причина (необязательно)");
    expect(container.querySelectorAll("button[aria-label]").length).toBeGreaterThan(0);
  });
});
