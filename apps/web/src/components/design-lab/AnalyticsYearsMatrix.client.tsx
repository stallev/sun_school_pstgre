"use client";

import { useState } from "react";
import { ACADEMIC_YEAR_STATUS, ANALYTICS_METHODOLOGY_VERSION } from "@sunschool/domain";
import type { Dictionary } from "@/lib/messages/dictionary-types";
import { pickAnalyticsMessages } from "@/lib/messages/pick-analytics-messages";
import { DiffBadge } from "@/components/analytics/years/DiffBadge";
import { KpiTiles } from "@/components/analytics/years/KpiTiles";
import { MethodologyVersionNote } from "@/components/analytics/years/MethodologyVersionNote";
import { PupilYearsSection, type PupilYearMetric } from "@/components/analytics/years/PupilYearsSection";
import { ReadOnlyYearNote } from "@/components/analytics/years/ReadOnlyYearNote";
import { YearStrip } from "@/components/analytics/years/YearStrip";
import { YearTotalsTable, type YearTotalsTableRow } from "@/components/analytics/years/YearTotalsTable";

type AnalyticsYearsMatrixProps = {
  analyticsDictionary: Dictionary;
};

const GROUP_ROWS: YearTotalsTableRow[] = [
  {
    yearId: "2024",
    yearName: "2024–2025",
    status: ACADEMIC_YEAR_STATUS.CLOSED,
    methodologyVersion: "v0",
    totals: { kids: 8, lessons: 6, attendance: 0.72, verses: 1.2, test: 7.1, notebook: 6.8 },
    diff: null,
    comparisonReliable: false,
  },
  {
    yearId: "2025",
    yearName: "2025–2026",
    status: ACADEMIC_YEAR_STATUS.CLOSED,
    methodologyVersion: ANALYTICS_METHODOLOGY_VERSION,
    totals: { kids: 14, lessons: 8, attendance: 0.78, verses: 1.5, test: 7.4, notebook: 7.0 },
    diff: { attendance: 6, verses: 0.3, test: 0.3, notebook: 0.2 },
    comparisonReliable: true,
    previousYearName: "2024–2025",
  },
  {
    yearId: "2026",
    yearName: "2026–2027",
    status: ACADEMIC_YEAR_STATUS.ACTIVE,
    methodologyVersion: ANALYTICS_METHODOLOGY_VERSION,
    totals: { kids: 12, lessons: 5, attendance: 0.81, verses: 1.6, test: 7.8, notebook: 7.2 },
    diff: { attendance: 3, verses: 0.1, test: 0.4, notebook: 0.2 },
    comparisonReliable: true,
    previousYearName: "2025–2026",
  },
];

export const AnalyticsYearsMatrix = ({ analyticsDictionary }: AnalyticsYearsMatrixProps) => {
  const messages = pickAnalyticsMessages(analyticsDictionary);
  const [yearId, setYearId] = useState("2025");
  const [pupilYearId, setPupilYearId] = useState("2025");
  const [metric, setMetric] = useState<PupilYearMetric>("attendance");
  const yearMessages = messages.years;
  const selectedRow = GROUP_ROWS.find((row) => row.yearId === yearId) ?? GROUP_ROWS[1]!;

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <p className="text-sm font-medium text-ink">DiffBadge</p>
        <div className="flex flex-wrap gap-4">
          <DiffBadge metric="attendance" delta={6} comparisonReliable previousYearName="2024–2025" messages={yearMessages} />
          <DiffBadge metric="verses" delta={-0.4} comparisonReliable previousYearName="2024–2025" messages={yearMessages} />
          <DiffBadge metric="test" delta={0} comparisonReliable messages={yearMessages} />
          <DiffBadge metric="notebook" delta={0.2} comparisonReliable={false} messages={yearMessages} />
        </div>
      </div>
      <ReadOnlyYearNote messages={yearMessages} />
      <MethodologyVersionNote
        snapshotVersion="v0"
        currentVersion={ANALYTICS_METHODOLOGY_VERSION}
        messages={yearMessages}
      />
      <YearStrip
        years={GROUP_ROWS.map((row) => ({
          id: row.yearId,
          name: row.yearName,
          isActive: row.status === ACADEMIC_YEAR_STATUS.ACTIVE,
        }))}
        selectedYearId={yearId}
        onSelectYear={setYearId}
        messages={yearMessages}
      />
      <YearTotalsTable
        groupLabel="Средняя"
        rows={GROUP_ROWS}
        selectedYearId={yearId}
        onSelectYear={setYearId}
        messages={messages}
        yearMessages={yearMessages}
      />
      {selectedRow.totals && (
        <KpiTiles
          totals={selectedRow.totals}
          diff={selectedRow.diff}
          comparisonReliable={selectedRow.comparisonReliable}
          previousYearName={selectedRow.previousYearName}
          messages={messages}
          yearMessages={yearMessages}
        />
      )}
      <PupilYearsSection
        rows={[
          {
            yearId: "2024",
            yearName: "2024–2025",
            isActive: false,
            gradeLabels: "Младшая",
            lessons: 2,
            attendance: null,
            verses: null,
            test: null,
            notebook: null,
            bricksEarned: 4,
            bricksIssued: 3,
            insufficientLessons: true,
          },
          {
            yearId: "2025",
            yearName: "2025–2026",
            isActive: false,
            gradeLabels: "Средняя → Старшая 1",
            lessons: 8,
            attendance: 0.85,
            verses: 1.7,
            test: 8.1,
            notebook: 7.5,
            bricksEarned: 12,
            bricksIssued: 10,
            insufficientLessons: false,
          },
        ]}
        selectedYearId={pupilYearId}
        selectedMetric={metric}
        showForeignGroupNote
        onSelectYear={setPupilYearId}
        onSelectMetric={setMetric}
        messages={messages}
        pupilYearMessages={messages.pupilYears}
        yearStripMessages={yearMessages}
      />
    </div>
  );
};
