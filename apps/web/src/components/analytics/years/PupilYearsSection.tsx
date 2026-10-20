"use client";

import { SectionTitle } from "@/components/atoms/SectionTitle";
import type { AnalyticsMessages, AnalyticsPupilYearMessages, AnalyticsYearMessages } from "@/lib/messages/analytics-messages";
import { YearStrip, type YearStripItem } from "./YearStrip";
import { PupilYearsRowsTable } from "./PupilYearsRowsTable";
import { PupilYearsMetricPanel } from "./PupilYearsMetricPanel.client";

export type PupilYearTableRow = {
  yearId: string;
  yearName: string;
  isActive: boolean;
  gradeLabels: string;
  lessons: number;
  attendance: number | null;
  verses: number | null;
  test: number | null;
  notebook: number | null;
  bricksEarned: number;
  bricksIssued: number;
  insufficientLessons: boolean;
};

export type PupilYearMetric = "attendance" | "verses" | "test" | "notebook";

type PupilYearsSectionProps = {
  rows: readonly PupilYearTableRow[];
  selectedYearId: string;
  selectedMetric: PupilYearMetric;
  showForeignGroupNote: boolean;
  onSelectYear: (yearId: string) => void;
  onSelectMetric: (metric: PupilYearMetric) => void;
  messages: AnalyticsMessages;
  pupilYearMessages: AnalyticsPupilYearMessages;
  yearStripMessages: AnalyticsYearMessages;
};

export const PupilYearsSection = ({
  rows,
  selectedYearId,
  selectedMetric,
  showForeignGroupNote,
  onSelectYear,
  onSelectMetric,
  messages,
  pupilYearMessages,
  yearStripMessages,
}: PupilYearsSectionProps) => {
  const stripYears: YearStripItem[] = rows.map((row) => ({
    id: row.yearId,
    name: row.yearName,
    isActive: row.isActive,
  }));

  return (
    <section className="mb-6">
      <SectionTitle as="h2" className="mb-2">
        {pupilYearMessages.title}
      </SectionTitle>
      <YearStrip
        years={stripYears}
        selectedYearId={selectedYearId}
        onSelectYear={onSelectYear}
        messages={yearStripMessages}
        className="mb-4"
      />
      <PupilYearsRowsTable
        rows={rows}
        selectedYearId={selectedYearId}
        onSelectYear={onSelectYear}
        messages={messages}
        pupilYearMessages={pupilYearMessages}
        yearMessages={yearStripMessages}
        showForeignGroupNote={showForeignGroupNote}
      />
      <PupilYearsMetricPanel
        rows={rows}
        selectedMetric={selectedMetric}
        onSelectMetric={onSelectMetric}
        messages={messages}
        pupilYearMessages={pupilYearMessages}
      />
    </section>
  );
};
