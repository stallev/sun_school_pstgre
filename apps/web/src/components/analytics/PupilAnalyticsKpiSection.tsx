import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import type { PupilAnalyticsView } from "@/data/analytics/pupil-analytics-present.server";
import { formatAnalyticsAverage } from "@/lib/analytics/format-analytics-display";
import { fillMessage } from "@/lib/messages/fill-message";
import type { PupilAnalyticsMessages } from "@/lib/messages/analytics-messages";

type PupilAnalyticsKpiSectionProps = {
  view: PupilAnalyticsView;
  messages: PupilAnalyticsMessages;
};

const formatPersonalMetric = (
  average: number | null,
  n: number,
  messages: PupilAnalyticsMessages,
  isMain: boolean,
): string => {
  if (average === null || n === 0) return messages.kpiEmpty;
  const value = formatAnalyticsAverage(messages.formatAverage, Number(average.toFixed(1)));
  const core = fillMessage(messages.kpiWithN, { value, n });
  return isMain ? core : `${core} ${messages.personalMetricSuffix}`;
};

export const PupilAnalyticsKpiSection = ({ view, messages }: PupilAnalyticsKpiSectionProps) => {
  const personalSuffix = view.isInMainSample ? "" : ` ${messages.personalMetricSuffix}`;
  const attendanceValue = view.attendanceCheckedLabel ?? messages.kpiEmpty;
  const metrics: { label: string; value: string; hint?: string }[] = [
    { label: `${messages.kpiAttendanceLabel}${personalSuffix}`, value: attendanceValue },
    {
      label: `${messages.kpiVersesLabel}${personalSuffix}`,
      value: formatPersonalMetric(
        view.versesAverage.average,
        view.versesAverage.observationCount,
        messages,
        true,
      ),
    },
    {
      label: `${messages.kpiTestLabel}${personalSuffix}`,
      value: formatPersonalMetric(
        view.testAverage.average,
        view.testAverage.observationCount,
        messages,
        true,
      ),
      hint: `${messages.kpiOutOfTen} · N=${view.testAverage.observationCount}`,
    },
    {
      label: `${messages.kpiNotebookLabel}${personalSuffix}`,
      value: formatPersonalMetric(
        view.notebookAverage.average,
        view.notebookAverage.observationCount,
        messages,
        true,
      ),
      hint: `${messages.kpiOutOfTen} · N=${view.notebookAverage.observationCount}`,
    },
  ];

  return (
    <dl className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="flex min-w-0 flex-col gap-1 p-4">
          <dt className="text-sm text-muted-foreground">{metric.label}</dt>
          <dd>
            <NumberDisplay className="text-2xl">{metric.value}</NumberDisplay>
          </dd>
          {metric.hint ? (
            <ContentText className="text-xs text-muted-foreground">{metric.hint}</ContentText>
          ) : null}
        </Card>
      ))}
    </dl>
  );
};
