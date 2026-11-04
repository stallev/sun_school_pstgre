import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import { AnalyticsKpiMetricHeading } from "@/components/analytics/AnalyticsKpiMetricHeading";
import type { GroupAnalyticsSnapshot } from "@/data/analytics/analytics-compute.server";
import {
  formatAnalyticsChildrenHint,
} from "@/lib/analytics/analytics-metric-copy";
import {
  formatAnalyticsAverage,
  formatAnalyticsPercent,
} from "@/lib/analytics/format-analytics-display";
import { formatNumber, plural } from "@/lib/i18n/format";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import type { GlossaryMessages } from "@/lib/messages/pick-glossary-messages";

type AnalyticsPeriodKpiSectionProps = {
  snapshot: GroupAnalyticsSnapshot;
  messages: AnalyticsMessages;
  glossary: Pick<GlossaryMessages, "attendance" | "verses_per_lesson" | "test" | "notebook">;
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
  glossary,
}: AnalyticsPeriodKpiSectionProps) => {
  const { kpi, sampleCounts } = snapshot;
  const mainCount = sampleCounts.A;
  const childrenBase = plural(messages.kpiChildrenCount, mainCount, messages.formatLocale);

  return (
    <Card className="grid min-w-0 grid-cols-1 gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-center">
      <div className="min-w-0">
        <AnalyticsKpiMetricHeading
          label={messages.kpiAttendanceLabel}
          glossary={glossary.attendance}
        />
        <NumberDisplay size="kpi" className="mt-1">
          {kpi.attendancePercent === null
            ? messages.kpiEmpty
            : formatAnalyticsPercent(messages.formatPercent, kpi.attendancePercent / 100)}
        </NumberDisplay>
        <ContentText className="mt-2 text-base text-ink-2">
          {formatAnalyticsChildrenHint(messages, mainCount)}
        </ContentText>
      </div>
      <dl className="grid min-w-0 grid-cols-3 gap-4 border-t border-line pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
        <div>
          <dt>
            <AnalyticsKpiMetricHeading
              label={messages.kpiVersesLabel}
              glossary={glossary.verses_per_lesson}
            />
          </dt>
          <dd className="mt-1">
            <NumberDisplay size="kpi">
              {formatMetricValue(kpi.versesAverage.average, kpi.versesAverage.observationCount, messages)}
            </NumberDisplay>
          </dd>
          <dd className="text-base text-muted">
            {messages.kpiMetricAverageSuffix} · {childrenBase}
          </dd>
        </div>
        <div>
          <dt>
            <AnalyticsKpiMetricHeading label={messages.kpiTestLabel} glossary={glossary.test} />
          </dt>
          <dd className="mt-1">
            <NumberDisplay size="kpi">
              {formatMetricValue(kpi.testAverage.average, kpi.testAverage.observationCount, messages)}
            </NumberDisplay>
          </dd>
          <dd className="text-base text-muted">
            {messages.kpiOutOfTen} · {childrenBase}
          </dd>
        </div>
        <div>
          <dt>
            <AnalyticsKpiMetricHeading
              label={messages.kpiNotebookLabel}
              glossary={glossary.notebook}
            />
          </dt>
          <dd className="mt-1">
            <NumberDisplay size="kpi">
              {formatMetricValue(
                kpi.notebookAverage.average,
                kpi.notebookAverage.observationCount,
                messages,
              )}
            </NumberDisplay>
          </dd>
          <dd className="text-base text-muted">
            {messages.kpiOutOfTen} · {childrenBase}
          </dd>
        </div>
      </dl>
    </Card>
  );
};
