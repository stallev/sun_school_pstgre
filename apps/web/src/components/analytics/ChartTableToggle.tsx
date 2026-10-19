"use client";

import { useState } from "react";
import { SectionTitle } from "@/components/atoms/SectionTitle";
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
import type { AnalyticsChartSeriesMessages } from "@/lib/messages/analytics-messages";
import { LineChart } from "@/components/analytics/LineChart";

const MIN_CHART_POINTS = 2;

type ChartTableToggleProps = {
  chartId: string;
  title: string;
  methodology: string;
  points: AnalyticsChartPoint[];
  messages: AnalyticsChartSeriesMessages;
  formatDate: (iso: string) => string;
  formatValue: (point: AnalyticsChartPoint) => string;
  yDomain?: [number, number];
  /** When set (e.g. year axis), replaces the date column header in table mode. */
  xLabel?: string;
};

export const ChartTableToggle = ({
  chartId,
  title,
  methodology,
  points,
  messages,
  formatDate,
  formatValue,
  yDomain,
  xLabel,
}: ChartTableToggleProps) => {
  const storageKey = `analytics-chart-view-${chartId}`;
  const [showTable, setShowTable] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(storageKey) === "table",
  );

  const validPoints = points.filter((point) => point.value !== null);
  const hasChart = validPoints.length >= MIN_CHART_POINTS;

  const handleToggle = (table: boolean) => {
    setShowTable(table);
    sessionStorage.setItem(storageKey, table ? "table" : "chart");
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle as="h2" className="text-base">{title}</SectionTitle>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={showTable ? "outline" : "default"}
            aria-pressed={!showTable}
            onClick={() => handleToggle(false)}
          >
            {messages.showChart}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={showTable ? "default" : "outline"}
            aria-pressed={showTable}
            onClick={() => handleToggle(true)}
          >
            {messages.showTable}
          </Button>
        </div>
      </div>
      {!hasChart ? (
        <EmptyState
          title={messages.insufficientDataTitle}
          description={messages.insufficientDataDescription}
        />
      ) : showTable ? (
        <Table>
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
      <ContentText className="text-xs text-muted-foreground">{methodology}</ContentText>
    </Card>
  );
};
