/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AnalyticsPeriodFilter } from "@/components/analytics/AnalyticsPeriodFilter";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

const messages = {
  periodControlLabel: "Период",
  periodYear: "Весь год",
  periodMonth: "Месяц",
  periodRange: "Выбрать даты",
  periodApply: "Применить",
  periodApplied: "Фильтр применён",
  rangeFrom: "С",
  rangeTo: "По",
} as Pick<
  AnalyticsMessages,
  | "periodControlLabel"
  | "periodYear"
  | "periodMonth"
  | "periodRange"
  | "periodApply"
  | "periodApplied"
  | "rangeFrom"
  | "rangeTo"
>;

describe("AnalyticsPeriodFilter (R-22)", () => {
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

  it("shows one period control label and hides month/range fields for year mode", () => {
    act(() => {
      root.render(
        <AnalyticsPeriodFilter
          gradeId="g1"
          periodFilter={{ mode: "year", academicYearId: "y1" }}
          messages={messages as AnalyticsMessages}
          dateFieldCopy={{ locale: "ru", calendarAriaLabel: "Календарь" }}
        />,
      );
    });
    expect(container.textContent).toContain("Период");
    expect(container.querySelector('input[type="month"]')).toBeNull();
    expect(container.querySelectorAll('input[name="from"]').length).toBe(0);
  });

  it("shows applied status when isPeriodApplied", () => {
    act(() => {
      root.render(
        <AnalyticsPeriodFilter
          gradeId="g1"
          periodFilter={{ mode: "month", academicYearId: "y1", month: "2026-03" }}
          messages={messages as AnalyticsMessages}
          dateFieldCopy={{ locale: "ru", calendarAriaLabel: "Календарь" }}
          isPeriodApplied
        />,
      );
    });
    expect(container.textContent).toContain("Фильтр применён");
  });
});
