/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PupilAnalyticsKpiSection } from "@/components/analytics/PupilAnalyticsKpiSection";
import { CompositionLine } from "@/components/analytics/CompositionLine";
import { DataQualityLine } from "@/components/analytics/DataQualityLine";
import { MethodologyNote } from "@/components/analytics/MethodologyNote";
import type { GroupAnalyticsSnapshot } from "@/data/analytics/analytics-compute.server";
import type { AnalyticsMessages, PupilAnalyticsMessages } from "@/lib/messages/analytics-messages";
import type { GlossaryMessages } from "@/lib/messages/pick-glossary-messages";

const messages = {
  sampleCompositionLead: "Состав:",
  sampleLayerRegularly: "регулярно ходят",
  sampleLayerRarely: "ходят редко",
  sampleLayerInactive: "неактивные",
  sampleLayerNoChecks: "без проверенных уроков",
  methodology: { title: "Как мы считали цифры", body: "", items: ["Правило 1"] },
  dataQuality: {
    missingChecked: "Нет отметки в {count} записях проверенных уроков —",
    lessonsLinkLabel: "откройте журнал уроков",
    migrationDuplicates: "при переносе убрано дублей: {count}",
  },
} as Pick<
  AnalyticsMessages,
  | "sampleCompositionLead"
  | "sampleLayerRegularly"
  | "sampleLayerRarely"
  | "sampleLayerInactive"
  | "sampleLayerNoChecks"
  | "methodology"
  | "dataQuality"
>;

const snapshot = {
  sampleCounts: { A: 26, B: 4, C: 1, D: 0 },
} as GroupAnalyticsSnapshot;

describe("analytics readability components", () => {
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

  it("renders composition counts", () => {
    act(() => {
      root.render(<CompositionLine snapshot={snapshot} messages={messages as AnalyticsMessages} />);
    });
    expect(container.textContent).toContain("26");
    expect(container.textContent).toContain("4");
  });

  it("keeps methodology collapsed in details", () => {
    act(() => {
      root.render(<MethodologyNote messages={messages as AnalyticsMessages} />);
    });
    const details = container.querySelector("details");
    expect(details?.open).toBe(false);
  });

  it("renders TermHint on pupil average attendance KPI", () => {
    const pupilMessages = {
      kpiAttendanceLabel: "Средняя явка",
      kpiVersesLabel: "Стихов за урок",
      kpiTestLabel: "Тест",
      kpiNotebookLabel: "Тетрадь",
      kpiEmpty: "—",
      kpiOutOfTen: "из 10",
      personalMetricSuffix: "",
      formatLocale: "ru",
      formatAverage: "в среднем {value}",
    } as PupilAnalyticsMessages;
    const glossary = {
      attendance: { term: "Явка", hint: "Доля уроков с отметкой присутствия." },
      verses_per_lesson: { term: "Стихи", hint: "Подсказка стихов." },
      test: { term: "Тест", hint: "Подсказка теста." },
      notebook: { term: "Тетрадь", hint: "Подсказка тетради." },
    } as Pick<GlossaryMessages, "attendance" | "verses_per_lesson" | "test" | "notebook">;
    const view = {
      attendanceCheckedLabel: "5 из 6",
      versesAverage: { average: null, observationCount: 0 },
      testAverage: { average: null, observationCount: 0 },
      notebookAverage: { average: null, observationCount: 0 },
      isInMainSample: true,
    } as Parameters<typeof PupilAnalyticsKpiSection>[0]["view"];

    act(() => {
      root.render(
        <PupilAnalyticsKpiSection view={view} messages={pupilMessages} glossary={glossary} />,
      );
    });

    expect(container.querySelector('button[aria-label="Явка"]')).not.toBeNull();
  });

  it("shows teacher data quality link without admin migration text", () => {
    act(() => {
      root.render(
        <DataQualityLine
          missingRecords={3}
          migrationDuplicates={2}
          isAdmin={false}
          lessonsHref="/lessons?gradeId=g1"
          messages={messages as AnalyticsMessages}
        />,
      );
    });
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/lessons?gradeId=g1");
    expect(container.textContent).not.toContain("дублей");
  });
});
