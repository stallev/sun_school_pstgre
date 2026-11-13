"use client";

import { useMemo, useState } from "react";
import { Heading } from "@/components/atoms/Heading";
import { ContentText } from "@/components/atoms/ContentText";
import { EmptyState } from "@/components/patterns/EmptyState";
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
import { AnalyticsChartValueCell } from "@/components/analytics/AnalyticsChartValueCell";
import { LineChart } from "@/components/analytics/LineChart";
import type { AnalyticsChartPoint } from "@/data/analytics/analytics-compute.server";
import {
  computeVersesChartScale,
  PERCENT_CHART_SCALE,
  SCORE_0_10_CHART_SCALE,
} from "@/lib/analytics/chart-scale";
import {
  formatAnalyticsChartAxisTick,
  formatAnalyticsChartValue,
  formatAnalyticsPercent,
  formatAnalyticsShortDate,
} from "@/lib/analytics/format-analytics-display";
import type { AnalyticsChartSeriesMessages } from "@/lib/messages/analytics-messages";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import type { PluralForms } from "@/lib/messages/plural";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";
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
  lessonsObservedForms: PluralForms;
  formatLocale: MessageLocale;
  emptyLabel: string;
  yDomain?: [number, number];
  averagedOverHint?: HintTerm;
  termHintAriaLabel?: string;
  xLabel?: string;
  minChartPoints?: number;
  className?: string;
};

const resolveChartScale = (
  chartId: string,
  valueKind: ChartTableToggleProps["valueKind"],
  yDomain: [number, number] | undefined,
  numericValues: number[],
) => {
  if (valueKind === "percent") return PERCENT_CHART_SCALE;
  if (yDomain?.[1] === 10) return SCORE_0_10_CHART_SCALE;
  if (chartId.includes("verses")) return computeVersesChartScale(numericValues);
  if (yDomain) {
    return { domain: yDomain, ticks: undefined as number[] | undefined };
  }
  return computeVersesChartScale(numericValues);
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
  lessonsObservedForms,
  formatLocale,
  emptyLabel,
  yDomain,
  averagedOverHint,
  termHintAriaLabel,
  xLabel,
  minChartPoints = DEFAULT_MIN_CHART_POINTS,
  className,
}: ChartTableToggleProps) => {
  const storageKey = `analytics-chart-view-${chartId}`;
  const [showTable, setShowTable] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(storageKey) === "table",
  );

  const formatDate = (iso: string) => formatAnalyticsShortDate(iso, locale);
  const numericValues = useMemo(
    () =>
      points
        .map((point) => point.value)
        .filter((value): value is number => value !== null && Number.isFinite(value)),
    [points],
  );
  const scale = useMemo(
    () => resolveChartScale(chartId, valueKind, yDomain, numericValues),
    [chartId, numericValues, valueKind, yDomain],
  );

  const formatValue = (point: AnalyticsChartPoint) =>
    valueKind === "percent"
      ? point.value === null
        ? emptyLabel
        : formatAnalyticsPercent(percentTemplate, point.value / 100)
      : formatAnalyticsChartValue(
          chartValueTemplate,
          emptyLabel,
          point.value,
          point.observationCount,
          lessonsObservedForms,
          formatLocale,
        );

  const validPoints = points.filter((point) => point.value !== null);
  const hasChart = validPoints.length >= minChartPoints;
  const yAxisTickFormatter = (value: number) =>
    formatAnalyticsChartAxisTick(
      percentTemplate,
      value,
      formatLocale,
      valueKind === "percent" ? "percent" : "score",
    );

  const handleToggle = (table: boolean) => {
    setShowTable(table);
    sessionStorage.setItem(storageKey, table ? "table" : "chart");
  };

  const showAveragedHint =
    valueKind === "chart" && averagedOverHint && termHintAriaLabel && validPoints.length > 0;

  return (
    <Card className={cn("flex h-full min-w-0 flex-col gap-3 overflow-visible p-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading as="h3" level="section" className="text-lg">
          {title}
        </Heading>
        <SegmentedControl
          aria-label={title}
          grouped
          value={showTable ? "table" : "chart"}
          onValueChange={(next) => handleToggle(next === "table")}
          options={[
            { value: "chart", label: messages.showChart },
            { value: "table", label: messages.showTable },
          ]}
        />
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
                  <TableCell>
                    {showAveragedHint ? (
                      <AnalyticsChartValueCell
                        point={point}
                        chartValueTemplate={chartValueTemplate}
                        emptyLabel={emptyLabel}
                        lessonsObservedForms={lessonsObservedForms}
                        formatLocale={formatLocale}
                        averagedOverHint={averagedOverHint}
                        termHintAriaLabel={termHintAriaLabel}
                      />
                    ) : (
                      formatValue(point)
                    )}
                  </TableCell>
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
            yDomain={scale.domain}
            yTicks={scale.ticks}
            yAxisTickFormatter={yAxisTickFormatter}
            ariaLabel={title}
          />
        )}
      </div>
      <ContentText className="mt-1 text-base text-muted">{methodology}</ContentText>
    </Card>
  );
};
