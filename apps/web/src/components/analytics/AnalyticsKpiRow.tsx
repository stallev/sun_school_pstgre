import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import type { GroupAnalyticsSnapshot } from "@/data/analytics/analytics-compute.server";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type AnalyticsKpiRowProps = {
  snapshot: GroupAnalyticsSnapshot;
  messages: AnalyticsMessages;
};

const formatMetric = (
  average: number | null,
  observationCount: number,
  messages: AnalyticsMessages,
  asPercent = false,
): string => {
  if (average === null || observationCount === 0) return messages.kpiEmpty;
  const rounded = Number(average.toFixed(1));
  const value = asPercent ? messages.formatPercent(rounded) : messages.formatAverage(rounded);
  return messages.kpiWithN(value, observationCount);
};

export const AnalyticsKpiRow = ({ snapshot, messages }: AnalyticsKpiRowProps) => {
  const { kpi, sampleCounts } = snapshot;
  const mainCount = sampleCounts.A;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="flex flex-col gap-2 p-4">
        <SectionTitle as="h2" className="text-base">
          {messages.kpiAttendanceLabel}
        </SectionTitle>
        <NumberDisplay className="text-3xl">
          {kpi.attendancePercent === null
            ? messages.kpiEmpty
            : messages.formatPercent(Number(kpi.attendancePercent.toFixed(1)))}
        </NumberDisplay>
        <ContentText className="text-sm text-muted-foreground">
          {messages.kpiAttendanceHint(mainCount)}
        </ContentText>
      </Card>
      <Card className="flex flex-col gap-2 p-4">
        <SectionTitle as="h2" className="text-base">{messages.kpiVersesLabel}</SectionTitle>
        <ContentText className="text-lg font-medium text-ink">
          {formatMetric(kpi.versesAverage.average, kpi.versesAverage.observationCount, messages)}
        </ContentText>
      </Card>
      <Card className="flex flex-col gap-2 p-4">
        <SectionTitle as="h2" className="text-base">{messages.kpiTestLabel}</SectionTitle>
        <ContentText className="text-lg font-medium text-ink">
          {formatMetric(kpi.testAverage.average, kpi.testAverage.observationCount, messages)}
        </ContentText>
      </Card>
      <Card className="flex flex-col gap-2 p-4">
        <SectionTitle as="h2" className="text-base">{messages.kpiNotebookLabel}</SectionTitle>
        <ContentText className="text-lg font-medium text-ink">
          {formatMetric(kpi.notebookAverage.average, kpi.notebookAverage.observationCount, messages)}
        </ContentText>
      </Card>
    </div>
  );
};
