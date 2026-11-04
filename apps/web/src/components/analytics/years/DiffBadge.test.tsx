import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DiffBadge } from "./DiffBadge";
import type { AnalyticsYearMessages } from "@/lib/messages/analytics-messages";

const yearMessages: AnalyticsYearMessages = {
  stripLabel: "",
  title: "",
  compositionNote: "",
  tableCaption: "",
  insufficientForComparison: "мало данных",
  diffHigher: "+{amount} к прошлому году",
  diffLower: "−{amount} к прошлому году",
  diffSame: "без изменений",
  formatLocale: "ru",
  none: "",
  readonlyNote: "",
  methodologyNote: "",
  methodologyBadge: "",
  snapshotMissing: "",
  allYearsLink: "",
  activeBadge: "",
  closedBadge: "",
  columnYear: "",
  columnKids: "",
  columnLessons: "",
  columnAttendance: "",
  columnVerses: "",
  columnTest: "",
  columnNotebook: "",
  sampleMeta: "",
  outOfTen: "",
  detailPending: "",
};

describe("DiffBadge", () => {
  it("renders unified year comparison copy for attendance and score metrics", () => {
    const attendance = renderToStaticMarkup(
      <DiffBadge
        metric="attendance"
        delta={1}
        hasPreviousYear
        comparisonReliable
        messages={yearMessages}
      />,
    );
    expect(attendance).toContain("+1% к прошлому году");

    const verses = renderToStaticMarkup(
      <DiffBadge
        metric="verses"
        delta={0.1}
        hasPreviousYear
        comparisonReliable
        messages={yearMessages}
      />,
    );
    expect(verses).toContain("+0,1 к прошлому году");

    const same = renderToStaticMarkup(
      <DiffBadge
        metric="test"
        delta={0}
        hasPreviousYear
        comparisonReliable
        messages={yearMessages}
      />,
    );
    expect(same).toContain("без изменений");
  });
});
