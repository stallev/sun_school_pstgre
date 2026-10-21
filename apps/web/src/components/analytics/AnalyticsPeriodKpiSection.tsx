import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import type { GroupAnalyticsSnapshot } from "@/data/analytics/analytics-compute.server";
import {
  formatAnalyticsAverage,
  formatAnalyticsPercent,
} from "@/lib/analytics/format-analytics-display";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type AnalyticsPeriodKpiSectionProps = {
  snapshot: GroupAnalyticsSnapshot;
  messages: AnalyticsMessages;
};

const formatMetric = (
  average: number | null,
  observationCount: number,
  messages: AnalyticsMessages,
): string => {
  if (average === null || observationCount === 0) return messages.kpiEmpty;
  return formatAnalyticsAverage(messages.formatAverage, Number(average.toFixed(1)));
};

export const AnalyticsPeriodKpiSection = ({
  snapshot,
  messages,
}: AnalyticsPeriodKpiSectionProps) => {
  const { kpi, sampleCounts } = snapshot;
  const mainCount = sampleCounts.A;

  return (
    <Card className="grid min-w-0 grid-cols-1 gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-center">
      <div className="min-w-0">
        <ContentText className="text-sm text-muted">{messages.kpiAttendanceLabel}</ContentText>
        <NumberDisplay className="mt-1 text-[3.5rem] font-medium leading-none tabular-nums tracking-[-0.02em]">
          {kpi.attendancePercent === null
            ? messages.kpiEmpty
            : formatAnalyticsPercent(
                messages.formatPercent,
                Number(kpi.attendancePercent.toFixed(1)),
              )}
        </NumberDisplay>
        <ContentText className="mt-2 text-sm text-ink-2">
          {fillMessage(messages.kpiAttendanceHint, { count: mainCount })}
        </ContentText>
      </div>
      <dl className="grid min-w-0 grid-cols-3 gap-4 border-t border-line pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
        <div>
          <dt className="text-sm text-muted">{messages.kpiVersesLabel}</dt>
          <dd className="mt-1">
            <NumberDisplay size="kpi">
              {formatMetric(kpi.versesAverage.average, kpi.versesAverage.observationCount, messages)}
            </NumberDisplay>
          </dd>
          <dd className="text-xs text-muted">N={kpi.versesAverage.observationCount}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">{messages.kpiTestLabel}</dt>
          <dd className="mt-1">
            <NumberDisplay size="kpi">
              {formatMetric(kpi.testAverage.average, kpi.testAverage.observationCount, messages)}
            </NumberDisplay>
          </dd>
          <dd className="text-xs text-muted">
            {messages.kpiOutOfTen} · N={kpi.testAverage.observationCount}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">{messages.kpiNotebookLabel}</dt>
          <dd className="mt-1">
            <NumberDisplay size="kpi">
              {formatMetric(
                kpi.notebookAverage.average,
                kpi.notebookAverage.observationCount,
                messages,
              )}
            </NumberDisplay>
          </dd>
          <dd className="text-xs text-muted">
            {messages.kpiOutOfTen} · N={kpi.notebookAverage.observationCount}
          </dd>
        </div>
      </dl>
    </Card>
  );
};
