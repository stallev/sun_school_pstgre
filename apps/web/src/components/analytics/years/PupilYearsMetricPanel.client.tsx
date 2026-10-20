"use client";

import { useState } from "react";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart } from "@/components/analytics/BarChart";
import { cn } from "@/lib/utils";
import type { AnalyticsMessages, AnalyticsPupilYearMessages } from "@/lib/messages/analytics-messages";
import type { PupilYearMetric, PupilYearTableRow } from "./PupilYearsSection";
import { formatPupilYearMetric } from "./format-pupil-year-metric";

type PupilYearsMetricPanelProps = {
  rows: readonly PupilYearTableRow[];
  selectedMetric: PupilYearMetric;
  onSelectMetric: (metric: PupilYearMetric) => void;
  messages: AnalyticsMessages;
  pupilYearMessages: AnalyticsPupilYearMessages;
};

const METRIC_OPTIONS = (pupilYearMessages: AnalyticsPupilYearMessages) =>
  [
    { value: "attendance" as const, label: pupilYearMessages.metricAttendance },
    { value: "verses" as const, label: pupilYearMessages.metricVerses },
    { value: "test" as const, label: pupilYearMessages.metricTest },
    { value: "notebook" as const, label: pupilYearMessages.metricNotebook },
  ] as const;

const metricDomain = (metric: PupilYearMetric): [number, number] => {
  if (metric === "attendance") return [0, 1];
  if (metric === "verses") return [0, 3];
  return [0, 10];
};

export const PupilYearsMetricPanel = ({
  rows,
  selectedMetric,
  onSelectMetric,
  messages,
  pupilYearMessages,
}: PupilYearsMetricPanelProps) => {
  const [showTable, setShowTable] = useState(false);
  const chartLabels = rows.map((row) => row.yearName);
  const chartValues = rows.map((row) =>
    row.insufficientLessons || row[selectedMetric] === null ? null : row[selectedMetric],
  );

  return (
    <Card className="mt-4 space-y-3 p-5">
      <div className="max-w-md">
        <SegmentedControl
          options={METRIC_OPTIONS(pupilYearMessages)}
          value={selectedMetric}
          onValueChange={onSelectMetric}
          aria-label={pupilYearMessages.metricSelectorLabel}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={cn(
            "min-h-11 rounded-lg border px-3 text-sm",
            !showTable && "border-cobalt-ink bg-cobalt-soft",
          )}
          aria-pressed={!showTable}
          onClick={() => setShowTable(false)}
        >
          {messages.charts.showChart}
        </button>
        <button
          type="button"
          className={cn(
            "min-h-11 rounded-lg border px-3 text-sm",
            showTable && "border-cobalt-ink bg-cobalt-soft",
          )}
          aria-pressed={showTable}
          onClick={() => setShowTable(true)}
        >
          {messages.charts.showTable}
        </button>
      </div>
      {showTable ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{pupilYearMessages.chartColumnYear}</TableHead>
              <TableHead scope="col">{messages.charts.columnValue}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.yearId}>
                <TableCell>{row.yearName}</TableCell>
                <TableCell>
                  {row.insufficientLessons || chartValues[index] === null
                    ? pupilYearMessages.chartInsufficient
                    : formatPupilYearMetric(
                        selectedMetric,
                        chartValues[index] as number,
                        messages,
                      )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <BarChart
          labels={chartLabels}
          values={chartValues}
          formatLabel={(label) => label}
          formatValue={(value) => formatPupilYearMetric(selectedMetric, value, messages)}
          yDomain={metricDomain(selectedMetric)}
          xLabel={pupilYearMessages.chartColumnYear}
          ariaLabel={pupilYearMessages.chartAria(selectedMetric)}
        />
      )}
      <ContentText className="text-sm text-muted-foreground">{pupilYearMessages.chartNote}</ContentText>
    </Card>
  );
};
