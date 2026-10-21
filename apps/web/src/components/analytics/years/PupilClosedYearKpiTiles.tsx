import type { PupilYearTotals } from "@sunschool/domain";
import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { Card } from "@/components/ui/card";
import {
  formatAnalyticsAverage,
  formatAnalyticsPercent,
} from "@/lib/analytics/format-analytics-display";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages, AnalyticsPupilYearMessages } from "@/lib/messages/analytics-messages";

type PupilClosedYearKpiTilesProps = {
  totals: PupilYearTotals;
  bricksIssued: number;
  insufficientLessons: boolean;
  messages: AnalyticsMessages;
  pupilYearMessages: AnalyticsPupilYearMessages;
};

const formatMetric = (
  key: "attendance" | "verses" | "test" | "notebook",
  value: number | null,
  messages: AnalyticsMessages,
): string => {
  if (value === null) return messages.kpiEmpty;
  if (key === "attendance") {
    return formatAnalyticsPercent(messages.formatPercent, Number((value * 100).toFixed(1)));
  }
  return formatAnalyticsAverage(messages.formatAverage, Number(value.toFixed(1)));
};

export const PupilClosedYearKpiTiles = ({
  totals,
  bricksIssued,
  insufficientLessons,
  messages,
  pupilYearMessages,
}: PupilClosedYearKpiTilesProps) => {
  const metricCards: [string, string][] = [
    [messages.kpiAttendanceLabel, formatMetric("attendance", totals.attendance, messages)],
    [messages.kpiVersesLabel, formatMetric("verses", totals.verses, messages)],
    [messages.kpiTestLabel, formatMetric("test", totals.test, messages)],
    [messages.kpiNotebookLabel, formatMetric("notebook", totals.notebook, messages)],
  ];

  return (
    <dl className="grid min-w-0 grid-cols-2 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {metricCards.map(([label, value]) => (
        <Card key={label} className="flex h-full flex-col gap-1 p-4">
          <dt className="text-sm text-muted">{label}</dt>
          <dd>
            <NumberDisplay size="kpi">
              {insufficientLessons ? messages.kpiEmpty : value}
            </NumberDisplay>
          </dd>
        </Card>
      ))}
      <Card className="flex h-full flex-col gap-1 p-4">
        <dt className="text-sm text-muted">{pupilYearMessages.columnBricks}</dt>
        <dd>
          <NumberDisplay size="kpi">
            {fillMessage(pupilYearMessages.bricksRatio, {
              earned: totals.bricksEarned,
              issued: bricksIssued,
            })}
          </NumberDisplay>
        </dd>
      </Card>
    </dl>
  );
};
