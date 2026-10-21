import { ACADEMIC_YEAR_STATUS, ANALYTICS_METHODOLOGY_VERSION } from "@sunschool/domain";
import { RecordCard } from "@/components/patterns/RecordCard";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages, AnalyticsYearMessages } from "@/lib/messages/analytics-messages";
import { DiffBadge, type YearDiffMetric } from "./DiffBadge";
import { formatYearMetricValue } from "./format-year-metric-value";
import type { YearTotalsTableRow } from "./YearTotalsTable";

type YearTotalsCardsProps = {
  rows: readonly YearTotalsTableRow[];
  selectedYearId: string;
  onSelectYear: (yearId: string) => void;
  messages: AnalyticsMessages;
  yearMessages: AnalyticsYearMessages;
  label: string;
};

const METRIC_COLS: { key: YearDiffMetric; label: (m: AnalyticsYearMessages) => string }[] = [
  { key: "attendance", label: (m) => m.columnAttendance },
  { key: "verses", label: (m) => m.columnVerses },
  { key: "test", label: (m) => m.columnTest },
  { key: "notebook", label: (m) => m.columnNotebook },
];

export const YearTotalsCards = ({
  rows,
  selectedYearId,
  onSelectYear,
  messages,
  yearMessages,
  label,
}: YearTotalsCardsProps) => (
  <ul className="space-y-2 lg:space-y-3 lg:hidden" aria-label={label}>
    {rows.map((row) => {
      const selected = row.yearId === selectedYearId;
      const isActive = row.status === ACADEMIC_YEAR_STATUS.ACTIVE;
      const staleMethod = row.methodologyVersion !== ANALYTICS_METHODOLOGY_VERSION;
      return (
        <RecordCard
          cardType="analytics"
          key={row.yearId}
          selected={selected}
          title={
            <button
              type="button"
              onClick={() => onSelectYear(row.yearId)}
              aria-current={selected ? "true" : undefined}
              className="min-h-11 text-left hover:text-cobalt-ink"
            >
              {row.yearName}
              <span className="block text-base font-normal text-muted-foreground">
                {isActive ? yearMessages.activeBadge : yearMessages.closedBadge}
                {staleMethod
                  ? ` · ${fillMessage(yearMessages.methodologyBadge, { version: row.methodologyVersion })}`
                  : ""}
              </span>
            </button>
          }
          fields={[
            { label: yearMessages.columnKids, value: row.totals?.kids ?? messages.kpiEmpty },
            { label: yearMessages.columnLessons, value: row.totals?.lessons ?? messages.kpiEmpty },
            ...METRIC_COLS.map(({ key, label: metricLabel }) => ({
              label: metricLabel(yearMessages),
              value: (
                <>
                  <span className="tabular-nums">{formatYearMetricValue(key, row.totals, messages)}</span>
                  <span className="block text-base font-normal text-ink-2">
                    <DiffBadge
                      metric={key}
                      delta={row.diff?.[key] ?? null}
                      hasPreviousYear={row.hasPreviousYear}
                      comparisonReliable={row.comparisonReliable}
                      previousYearName={row.previousYearName}
                      messages={yearMessages}
                    />
                  </span>
                </>
              ),
            })),
          ]}
        />
      );
    })}
  </ul>
);
