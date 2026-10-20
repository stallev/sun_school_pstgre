import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import type { GroupYearTotals, YearMetricDiff } from "@sunschool/domain";
import type { AnalyticsMessages, AnalyticsYearMessages } from "@/lib/messages/analytics-messages";
import { DiffBadge, type YearDiffMetric } from "./DiffBadge";

type KpiTilesProps = {
  totals: GroupYearTotals;
  diff: YearMetricDiff | null;
  hasPreviousYear: boolean;
  comparisonReliable: boolean;
  previousYearName?: string;
  messages: AnalyticsMessages;
  yearMessages: AnalyticsYearMessages;
};

const metricLabel = (key: YearDiffMetric, messages: AnalyticsMessages): string => {
  switch (key) {
    case "attendance":
      return messages.kpiAttendanceLabel;
    case "verses":
      return messages.kpiVersesLabel;
    case "test":
      return messages.kpiTestLabel;
    case "notebook":
      return messages.kpiNotebookLabel;
  }
};

const formatValue = (
  key: YearDiffMetric,
  value: number | null,
  messages: AnalyticsMessages,
): string => {
  if (value === null) return messages.kpiEmpty;
  if (key === "attendance") {
    return messages.formatPercent(Number((value * 100).toFixed(0)));
  }
  return messages.formatAverage(Number(value.toFixed(1)));
};

export const KpiTiles = ({
  totals,
  diff,
  hasPreviousYear,
  comparisonReliable,
  previousYearName,
  messages,
  yearMessages,
}: KpiTilesProps) => (
  <div className="space-y-2">
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {(["attendance", "verses", "test", "notebook"] as const).map((key) => (
        <Card key={key} className="flex flex-col gap-1 p-4">
          <dt className="text-sm text-muted-foreground">{metricLabel(key, messages)}</dt>
          <dd>
            <NumberDisplay className="text-2xl">{formatValue(key, totals[key], messages)}</NumberDisplay>
          </dd>
          {(key === "test" || key === "notebook") && (
            <dd className="text-xs text-muted-foreground">{yearMessages.outOfTen}</dd>
          )}
          <dd className="mt-1">
            <DiffBadge
              metric={key}
              delta={diff?.[key] ?? null}
              hasPreviousYear={hasPreviousYear}
              comparisonReliable={comparisonReliable}
              previousYearName={previousYearName}
              messages={yearMessages}
            />
          </dd>
        </Card>
      ))}
    </dl>
    <ContentText className="text-sm text-muted-foreground">
      {yearMessages.sampleMeta(totals.kids, totals.lessons)}
    </ContentText>
  </div>
);
