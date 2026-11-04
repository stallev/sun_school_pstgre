import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import type { GroupAnalyticsSnapshot } from "@/data/analytics/analytics-compute.server";
import {
  formatAnalyticsChildrenHint,
  formatAnalyticsLessonsObserved,
} from "@/lib/analytics/analytics-metric-copy";
import {
  formatAnalyticsAverage,
  formatAnalyticsPercent,
} from "@/lib/analytics/format-analytics-display";
import { formatNumber } from "@/lib/i18n/format";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type AnalyticsPeriodKpiSectionProps = {
  snapshot: GroupAnalyticsSnapshot;
  messages: AnalyticsMessages;
};

const formatMetricValue = (
  average: number | null,
  observationCount: number,
  messages: AnalyticsMessages,
): string => {
  if (average === null || observationCount === 0) return messages.kpiEmpty;
  const formattedAverage = formatNumber(
    Number(average.toFixed(1)),
    messages.formatLocale,
    { minimumFractionDigits: 1, maximumFractionDigits: 1 },
  );
  return formatAnalyticsAverage(messages.formatAverage, formattedAverage);
};

export const AnalyticsPeriodKpiSection = ({
  snapshot,
  messages,
}: AnalyticsPeriodKpiSectionProps) => {
  const { kpi, sampleCounts } = snapshot;
  const mainCount = sampleCounts.A;

  return (
    <Card className="grid min-w-0 grid-cols-1 gap-6 p-4 sm:p-5 lg:grid-cols-4 lg:items-stretch">
      <div className="min-w-0 lg:col-span-2">
        <ContentText className="text-sm text-muted">{messages.kpiAttendanceLabel}</ContentText>
        <NumberDisplay size="kpi" className="mt-1">
          {kpi.attendancePercent === null
            ? messages.kpiEmpty
            : formatAnalyticsPercent(messages.formatPercent, kpi.attendancePercent / 100)}
        </NumberDisplay>
        <ContentText className="mt-2 text-base text-ink-2">
          {formatAnalyticsChildrenHint(messages, mainCount)}
        </ContentText>
      </div>
      <dl className="grid min-w-0 grid-cols-3 gap-4 border-t border-line pt-5 lg:col-span-2 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
        <div>
          <dt className="text-sm text-muted">{messages.kpiVersesLabel}</dt>
          <dd className="mt-1 text-base tabular-nums">
            {formatMetricValue(kpi.versesAverage.average, kpi.versesAverage.observationCount, messages)}
          </dd>
          <dd className="text-sm text-muted">
            {formatAnalyticsLessonsObserved(messages, kpi.versesAverage.observationCount)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">{messages.kpiTestLabel}</dt>
          <dd className="mt-1 text-base tabular-nums">
            {formatMetricValue(kpi.testAverage.average, kpi.testAverage.observationCount, messages)}
          </dd>
          <dd className="text-sm text-muted">
            {messages.kpiOutOfTen} ·{" "}
            {formatAnalyticsLessonsObserved(messages, kpi.testAverage.observationCount)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">{messages.kpiNotebookLabel}</dt>
          <dd className="mt-1 text-base tabular-nums">
            {formatMetricValue(
              kpi.notebookAverage.average,
              kpi.notebookAverage.observationCount,
              messages,
            )}
          </dd>
          <dd className="text-sm text-muted">
            {messages.kpiOutOfTen} ·{" "}
            {formatAnalyticsLessonsObserved(messages, kpi.notebookAverage.observationCount)}
          </dd>
        </div>
      </dl>
    </Card>
  );
};
