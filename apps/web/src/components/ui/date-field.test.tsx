/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseLocaleDateInput, formatDate } from "@/lib/i18n/format";

vi.mock("next/dynamic", () => ({
  default: () =>
    function CalendarStub({ onSelectIso }: { onSelectIso: (iso: string) => void }) {
      return (
        <button type="button" data-testid="calendar-pick" onClick={() => onSelectIso("2026-05-10")}>
          Pick
        </button>
      );
    },
}));

import { DateField } from "@/components/ui/date-field";

function setInputText(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("DateField locale parsing (P14-CU3)", () => {
  it("formats ISO dates for ru locale", () => {
    expect(formatDate("2026-03-01", "ru")).toMatch(/01[./]03[./]2026/);
  });

  it("flags 31.02.2027 as invalid without producing ISO", () => {
    const result = parseLocaleDateInput("31.02.2027", "ru");
    expect(result.isCompleteInvalid).toBe(true);
    expect(result.iso).toBeNull();
  });

  it("parses valid ru input to ISO", () => {
    const result = parseLocaleDateInput("15.01.2026", "ru");
    expect(result).toEqual({ iso: "2026-01-15", isCompleteInvalid: false });
  });
});

describe("DateField form-submit hidden ISO (P14-CU3)", () => {
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

  it("keeps hidden ISO on parseInvalid and submits it via FormData", () => {
    const onChange = vi.fn();

    act(() => {
      root.render(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            expect(data.get("lessonDate")).toBe("2026-03-01");
          }}
        >
          <DateField
            name="lessonDate"
            value="2026-03-01"
            onChange={onChange}
            locale="ru"
            calendarAriaLabel="Open calendar"
          />
          <button type="submit">Save</button>
        </form>,
      );
    });

    const hidden = container.querySelector('input[type="hidden"][name="lessonDate"]') as HTMLInputElement;
    const visible = container.querySelector('[data-slot="input"]') as HTMLInputElement;

    expect(hidden.value).toBe("2026-03-01");

    act(() => {
      visible.focus();
      setInputText(visible, "31.02.2027");
    });

    expect(hidden.value).toBe("2026-03-01");
    expect(visible.getAttribute("aria-invalid")).toBe("true");

    act(() => {
      container.querySelector("form")?.requestSubmit();
    });
  });

  it("clears parseInvalid after calendar selection", () => {
    const onChange = vi.fn();

    act(() => {
      root.render(
        <DateField
          name="lessonDate"
          value="2026-03-01"
          onChange={onChange}
          locale="ru"
          calendarAriaLabel="Open calendar"
        />,
      );
    });

    const visible = container.querySelector('[data-slot="input"]') as HTMLInputElement;
    const calendarTrigger = container.querySelector('button[aria-label="Open calendar"]') as HTMLButtonElement;

    act(() => {
      visible.focus();
      setInputText(visible, "31.02.2027");
    });
    expect(visible.getAttribute("aria-invalid")).toBe("true");

    act(() => {
      calendarTrigger.click();
    });
    act(() => {
      document.querySelector('[data-testid="calendar-pick"]')?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(onChange).toHaveBeenCalledWith("2026-05-10");
    expect(visible.getAttribute("aria-invalid")).toBeNull();
  });
});
