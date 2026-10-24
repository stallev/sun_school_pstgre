import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { Card } from "@/components/ui/card";
import type { PupilAnalyticsView } from "@/data/analytics/pupil-analytics-present.server";
import { formatAnalyticsAverage } from "@/lib/analytics/format-analytics-display";
import type { PupilAnalyticsMessages } from "@/lib/messages/analytics-messages";

type PupilAnalyticsKpiSectionProps = {
  view: PupilAnalyticsView;
  messages: PupilAnalyticsMessages;
};

const formatAverageValue = (
  average: number | null,
  n: number,
  messages: PupilAnalyticsMessages,
): string | null => {
  if (average === null || n === 0) return null;
  return formatAnalyticsAverage(messages.formatAverage, Number(average.toFixed(1)));
};

export const PupilAnalyticsKpiSection = ({ view, messages }: PupilAnalyticsKpiSectionProps) => {
  const personalSuffix = view.isInMainSample ? "" : ` ${messages.personalMetricSuffix}`;
  const attendanceValue = view.attendanceCheckedLabel ?? messages.kpiEmpty;

  const versesValue = formatAverageValue(
    view.versesAverage.average,
    view.versesAverage.observationCount,
    messages,
  );
  const testValue = formatAverageValue(
    view.testAverage.average,
    view.testAverage.observationCount,
    messages,
  );
  const notebookValue = formatAverageValue(
    view.notebookAverage.average,
    view.notebookAverage.observationCount,
    messages,
  );

  return (
    <dl className="mb-0 grid grid-cols-2 items-stretch gap-4 lg:grid-cols-4">
      <Card className="col-span-2 h-full p-4 lg:col-span-2">
        <dt className="text-sm text-muted">
          {messages.kpiAttendanceLabel}
          {personalSuffix}
        </dt>
        <dd className="mt-1">
          <NumberDisplay size="kpi">{attendanceValue}</NumberDisplay>
        </dd>
      </Card>
      <Card className="h-full p-4">
        <dt className="text-sm text-muted">
          {messages.kpiVersesLabel}
          {personalSuffix}
        </dt>
        <dd className="mt-1 flex flex-wrap items-baseline gap-x-2 text-base">
          <span className="tabular-nums">{versesValue ?? messages.kpiEmpty}</span>
          {versesValue !== null ? (
            <span className="text-sm text-muted">N={view.versesAverage.observationCount}</span>
          ) : null}
        </dd>
      </Card>
      <Card className="h-full p-4">
        <dt className="text-sm text-muted">
          {messages.kpiTestLabel}
          {personalSuffix}
        </dt>
        <dd className="mt-1 flex flex-wrap items-baseline gap-x-2 text-base">
          <span className="tabular-nums">{testValue ?? messages.kpiEmpty}</span>
          {testValue !== null ? (
            <span className="text-sm text-muted">N={view.testAverage.observationCount}</span>
          ) : null}
        </dd>
      </Card>
      <Card className="h-full p-4">
        <dt className="text-sm text-muted">
          {messages.kpiNotebookLabel}
          {personalSuffix}
        </dt>
        <dd className="mt-1 flex flex-wrap items-baseline gap-x-2 text-base">
          <span className="tabular-nums">{notebookValue ?? messages.kpiEmpty}</span>
          {notebookValue !== null ? (
            <span className="text-sm text-muted">N={view.notebookAverage.observationCount}</span>
          ) : null}
        </dd>
      </Card>
    </dl>
  );
};
