import type { PupilYearTotals } from "@sunschool/domain";
import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Card } from "@/components/ui/card";
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
    return messages.formatPercent(Number((value * 100).toFixed(1)));
  }
  return messages.formatAverage(Number(value.toFixed(1)));
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {metricCards.map(([label, value]) => (
        <Card key={label} className="flex flex-col gap-2 p-4">
          <SectionTitle as="h2" className="text-base">
            {label}
          </SectionTitle>
          <NumberDisplay className="text-2xl">
            {insufficientLessons ? messages.kpiEmpty : value}
          </NumberDisplay>
        </Card>
      ))}
      <Card className="flex flex-col gap-2 p-4">
        <SectionTitle as="h2" className="text-base">
          {pupilYearMessages.columnBricks}
        </SectionTitle>
        <NumberDisplay className="text-2xl">
          {pupilYearMessages.bricksRatio(totals.bricksEarned, bricksIssued)}
        </NumberDisplay>
      </Card>
    </div>
  );
};
