/** @vitest-environment happy-dom */
import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { AuditFilterBar } from "./AuditFilterBar";

describe("AuditFilterBar", () => {
  it("lays the filters out on a 12-column grid with empty fields by default", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        <AuditFilterBar
          values={{ from: "", to: "", actor: "", entityType: "", action: "", showSystem: false }}
          actorOptions={[]}
          dateFieldCopy={{ locale: "ru", calendarAriaLabel: "Календарь" } as never}
          labels={{
            from: "С",
            to: "По",
            actor: "Актор",
            entityType: "Тип сущности",
            action: "Действие",
            all: "Все",
            submit: "Применить",
            reset: "Сбросить",
            showSystem: "Системные записи",
            showSystemHint: "Подсказка",
            showSystemHintAria: "Системные записи",
            entityTypeHint: "Подсказка",
            entityTypeHintAria: "Тип сущности",
            entityTypeLabels: {},
            actionLabels: {},
          }}
        />,
      );
    });

    const form = container.querySelector("form");
    expect(form?.className).toContain("grid-cols-12");
    const spans = Array.from(form?.children ?? []).map((child) => child.className);
    expect(spans.filter((cls) => cls.includes("md:col-span-4"))).toHaveLength(3);
    expect(spans.filter((cls) => cls.includes("md:col-span-6"))).toHaveLength(2);
    expect(spans.every((cls) => cls.includes("col-span-12"))).toBe(true);
    expect(container.querySelector<HTMLInputElement>("input[name=from]")?.value ?? "").toBe("");

    act(() => root.unmount());
    container.remove();
  });
});
