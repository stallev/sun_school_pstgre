"use client";

import { useState } from "react";
import { Heading } from "@/components/atoms/Heading";
import { ContentText } from "@/components/atoms/ContentText";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AnalyticsChartPoint } from "@/data/analytics/analytics-compute.server";
import {
  formatAnalyticsChartValue,
  formatAnalyticsPercent,
  formatAnalyticsShortDate,
} from "@/lib/analytics/format-analytics-display";
import type { AnalyticsChartSeriesMessages } from "@/lib/messages/analytics-messages";
import { LineChart } from "@/components/analytics/LineChart";
import { cn } from "@/lib/utils";

const DEFAULT_MIN_CHART_POINTS = 2;

type ChartTableToggleProps = {
  chartId: string;
  title: string;
  methodology: string;
  points: AnalyticsChartPoint[];
  messages: AnalyticsChartSeriesMessages;
  locale: string;
  valueKind: "percent" | "chart";
  percentTemplate: string;
  chartValueTemplate: string;
  emptyLabel: string;
  yDomain?: [number, number];
  /** When set (e.g. year axis), replaces the date column header in table mode. */
  xLabel?: string;
  minChartPoints?: number;
  className?: string;
};

export const ChartTableToggle = ({
  chartId,
  title,
  methodology,
  points,
  messages,
  locale,
  valueKind,
  percentTemplate,
  chartValueTemplate,
  emptyLabel,
  yDomain,
  xLabel,
  minChartPoints = DEFAULT_MIN_CHART_POINTS,
  className,
}: ChartTableToggleProps) => {
  const storageKey = `analytics-chart-view-${chartId}`;
  const [showTable, setShowTable] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(storageKey) === "table",
  );

  const formatDate = (iso: string) => formatAnalyticsShortDate(iso, locale);
  const formatValue = (point: AnalyticsChartPoint) =>
    valueKind === "percent"
      ? point.value === null
        ? emptyLabel
        : formatAnalyticsPercent(percentTemplate, Number(point.value.toFixed(1)))
      : formatAnalyticsChartValue(
          chartValueTemplate,
          emptyLabel,
          point.value,
          point.observationCount,
        );

  const validPoints = points.filter((point) => point.value !== null);
  const hasChart = validPoints.length >= minChartPoints;

  const handleToggle = (table: boolean) => {
    setShowTable(table);
    sessionStorage.setItem(storageKey, table ? "table" : "chart");
  };

  return (
    <Card className={cn("flex h-full min-w-0 flex-col gap-3 overflow-visible p-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading as="h3" level="section" className="text-lg">
          {title}
        </Heading>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={showTable ? undefined : "border-line-strong bg-surface font-medium"}
            aria-pressed={!showTable}
            onClick={() => handleToggle(false)}
          >
            {messages.showChart}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={showTable ? "border-line-strong bg-surface font-medium" : undefined}
            aria-pressed={showTable}
            onClick={() => handleToggle(true)}
          >
            {messages.showTable}
          </Button>
        </div>
      </div>
      <div className="mt-4 min-h-0 flex-1">
      {!hasChart ? (
        <EmptyState
          title={messages.insufficientDataTitle}
          description={messages.insufficientDataDescription}
        />
      ) : showTable ? (
        <Table className="text-base">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{xLabel ?? messages.columnDate}</TableHead>
              <TableHead scope="col">{messages.columnValue}</TableHead>
              <TableHead scope="col">{messages.columnObservations}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validPoints.map((point) => (
              <TableRow key={point.lessonId}>
                <TableCell>{formatDate(point.lessonDate)}</TableCell>
                <TableCell>{formatValue(point)}</TableCell>
                <TableCell>{point.observationCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <LineChart
          points={points}
          formatLabel={formatDate}
          formatValue={formatValue}
          yDomain={yDomain}
          ariaLabel={title}
        />
      )}
      </div>
      <ContentText className="mt-1 text-base text-muted">{methodology}</ContentText>
    </Card>
  );
};
