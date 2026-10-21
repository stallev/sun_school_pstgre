"use client";

import { TREND_LABEL } from "@sunschool/domain";
import { Check, Circle, TrendingDown, TrendingUp } from "lucide-react";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Card } from "@/components/ui/card";
import { BarChart } from "@/components/analytics/BarChart";
import { LineChart } from "@/components/analytics/LineChart";
import type { PupilAnalyticsView } from "@/data/analytics/pupil-analytics-present.server";
import {
  formatAnalyticsDelta,
  formatAnalyticsPercent,
  formatAnalyticsShortDate,
} from "@/lib/analytics/format-analytics-display";
import { fillMessage } from "@/lib/messages/fill-message";
import type { PupilAnalyticsMessages } from "@/lib/messages/analytics-messages";

const MIN_DYNAMICS_POINTS = 2;

type DynamicsBlockProps = {
  dynamics: PupilAnalyticsView["dynamics"];
  messages: PupilAnalyticsMessages;
  locale: string;
};

const renderTrendIcon = (label: PupilAnalyticsView["dynamics"]["trendLabel"]) => {
  const iconClass = "size-4";
  switch (label) {
    case TREND_LABEL.GROWING:
      return <TrendingUp className={iconClass} aria-hidden />;
    case TREND_LABEL.DECLINING:
      return <TrendingDown className={iconClass} aria-hidden />;
    case TREND_LABEL.STABLE:
      return <Check className={iconClass} aria-hidden />;
    default:
      return <Circle className={iconClass} aria-hidden />;
  }
};

export const DynamicsBlock = ({
  dynamics,
  messages,
  locale,
}: DynamicsBlockProps) => {
  const formatDate = (iso: string) => formatAnalyticsShortDate(iso, locale);
  const formatPercent = (value: number) =>
    formatAnalyticsPercent(messages.formatPercent, Number(value.toFixed(1)));
  const chartPoints = dynamics.smoothed.filter((point) => point.value !== null);
  const hasChart = chartPoints.length >= MIN_DYNAMICS_POINTS;
  const trendStyle = messages.dynamicsTrendLabels[dynamics.trendLabel];
  const deltaValues = dynamics.deltaValues.filter((value): value is number => value !== null);
  const deltaLimit = Math.max(4, Math.ceil(Math.max(...deltaValues.map(Math.abs), 0)));
  const growingLabel = messages.dynamicsTrendLabels[TREND_LABEL.GROWING].label;
  const decliningLabel = messages.dynamicsTrendLabels[TREND_LABEL.DECLINING].label;

  return (
    <Card className="flex flex-col gap-3 overflow-visible p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <SectionTitle as="h2">{messages.dynamicsTitle}</SectionTitle>
          <ContentText className="mt-1 max-w-prose text-[1.3125rem] leading-snug text-ink-2">
            {messages.dynamicsHint}
          </ContentText>
        </div>
        <div className="text-right">
          <p className={`inline-flex items-center gap-1.5 font-bold ${trendStyle.toneClass}`}>
            {renderTrendIcon(dynamics.trendLabel)}
            {trendStyle.label}
          </p>
          {dynamics.trendSlope !== null && dynamics.trendLabel !== TREND_LABEL.INSUFFICIENT_DATA ? (
            <ContentText className="text-base tabular-nums text-ink-2">
              {fillMessage(messages.dynamicsSlope, { delta: formatAnalyticsDelta(dynamics.trendSlope) })}
            </ContentText>
          ) : null}
        </div>
      </div>
      {!hasChart ? (
        <EmptyState
          title={messages.charts.insufficientDataTitle}
          description={
            dynamics.trendPointCount < 4
              ? messages.dynamicsInsufficientPoints
              : messages.charts.insufficientDataDescription
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 border-t border-line pt-3 lg:grid-cols-2 lg:border-t-0 lg:pt-0 lg:pl-3 lg:border-l">
          <div className="min-w-0 space-y-2">
            <ContentText className="text-[1.3125rem] font-medium leading-snug">
              {messages.dynamicsNormalizedTitle}
            </ContentText>
            <LineChart
              points={dynamics.smoothed}
              formatLabel={formatDate}
              formatValue={(point) => formatPercent(point.value as number)}
              yDomain={[0, 100]}
              ariaLabel={messages.dynamicsNormalizedAria}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <ContentText className="text-[1.3125rem] font-medium leading-snug">
              {messages.dynamicsDeltaTitle}
            </ContentText>
            {deltaValues.length >= 1 ? (
              <>
                <BarChart
                  labels={dynamics.deltaLabels}
                  values={dynamics.deltaValues}
                  formatLabel={formatDate}
                  formatValue={formatAnalyticsDelta}
                  yDomain={[-deltaLimit, deltaLimit]}
                  ariaLabel={messages.dynamicsDeltaAria}
                />
                <p className="mt-1 flex gap-2 text-base text-ink-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-series-1" aria-hidden />
                    {growingLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-series-2" aria-hidden />
                    {decliningLabel}
                  </span>
                </p>
              </>
            ) : (
              <EmptyState
                title={messages.charts.insufficientDataTitle}
                description={messages.charts.insufficientDataDescription}
              />
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
