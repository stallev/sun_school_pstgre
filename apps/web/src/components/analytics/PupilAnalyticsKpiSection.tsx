import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { Card } from "@/components/ui/card";
import { AnalyticsKpiMetricHeading } from "@/components/analytics/AnalyticsKpiMetricHeading";
import type { PupilAnalyticsView } from "@/data/analytics/pupil-analytics-present.server";
import { formatAnalyticsLessonsObserved, formatAnalyticsMetricAverage } from "@/lib/analytics/analytics-metric-copy";
import type { PupilAnalyticsMessages } from "@/lib/messages/analytics-messages";
import type { GlossaryMessages } from "@/lib/messages/pick-glossary-messages";

type PupilAnalyticsKpiSectionProps = {
  view: PupilAnalyticsView;
  messages: PupilAnalyticsMessages;
  glossary: Pick<GlossaryMessages, "attendance" | "verses_per_lesson" | "test" | "notebook">;
  termHintAriaLabel: string;
};

const formatAverageValue = (
  average: number | null,
  n: number,
  messages: PupilAnalyticsMessages,
): string | null => formatAnalyticsMetricAverage(average, n, messages);

export const PupilAnalyticsKpiSection = ({
  view,
  messages,
  glossary,
  termHintAriaLabel,
}: PupilAnalyticsKpiSectionProps) => {
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
        <dt>
          <AnalyticsKpiMetricHeading
            label={`${messages.kpiAttendanceLabel}${personalSuffix}`}
            glossary={glossary.attendance}
            termHintAriaLabel={termHintAriaLabel}
          />
        </dt>
        <dd className="mt-1">
          <NumberDisplay size="kpi">{attendanceValue}</NumberDisplay>
        </dd>
      </Card>
      <Card className="h-full p-4">
        <dt>
          <AnalyticsKpiMetricHeading
            label={`${messages.kpiVersesLabel}${personalSuffix}`}
            glossary={glossary.verses_per_lesson}
            termHintAriaLabel={termHintAriaLabel}
          />
        </dt>
        <dd className="mt-1 flex flex-wrap items-baseline gap-x-2 text-base">
          <NumberDisplay size="kpi">{versesValue ?? messages.kpiEmpty}</NumberDisplay>
          {versesValue !== null ? (
            <span className="text-sm text-muted">
              {formatAnalyticsLessonsObserved(messages, view.versesAverage.observationCount)}
            </span>
          ) : null}
        </dd>
      </Card>
      <Card className="h-full p-4">
        <dt>
          <AnalyticsKpiMetricHeading
            label={`${messages.kpiTestLabel}${personalSuffix}`}
            glossary={glossary.test}
            termHintAriaLabel={termHintAriaLabel}
          />
        </dt>
        <dd className="mt-1 flex flex-wrap items-baseline gap-x-2 text-base">
          <NumberDisplay size="kpi">{testValue ?? messages.kpiEmpty}</NumberDisplay>
          {testValue !== null ? (
            <span className="text-sm text-muted">
              {messages.kpiOutOfTen} ·{" "}
              {formatAnalyticsLessonsObserved(messages, view.testAverage.observationCount)}
            </span>
          ) : null}
        </dd>
      </Card>
      <Card className="h-full p-4">
        <dt>
          <AnalyticsKpiMetricHeading
            label={`${messages.kpiNotebookLabel}${personalSuffix}`}
            glossary={glossary.notebook}
            termHintAriaLabel={termHintAriaLabel}
          />
        </dt>
        <dd className="mt-1 flex flex-wrap items-baseline gap-x-2 text-base">
          <NumberDisplay size="kpi">{notebookValue ?? messages.kpiEmpty}</NumberDisplay>
          {notebookValue !== null ? (
            <span className="text-sm text-muted">
              {messages.kpiOutOfTen} ·{" "}
              {formatAnalyticsLessonsObserved(messages, view.notebookAverage.observationCount)}
            </span>
          ) : null}
        </dd>
      </Card>
    </dl>
  );
};
