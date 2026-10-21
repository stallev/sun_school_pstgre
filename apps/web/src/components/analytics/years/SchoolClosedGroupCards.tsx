import type { SchoolGroupYearRow } from "@/data/analytics/years/list-school-year-totals";
import { RecordCard } from "@/components/patterns/RecordCard";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { DiffBadge, type YearDiffMetric } from "./DiffBadge";
import { formatYearMetricValue } from "./format-year-metric-value";

type SchoolClosedGroupCardsProps = {
  yearName: string;
  rows: readonly SchoolGroupYearRow[];
  messages: AnalyticsMessages;
};

const METRIC_COLS: { key: YearDiffMetric; label: (m: AnalyticsMessages["school"]) => string }[] = [
  { key: "attendance", label: (m) => m.columnAttendance },
  { key: "verses", label: (m) => m.columnVersesShort },
  { key: "test", label: (m) => m.columnTestShort },
  { key: "notebook", label: (m) => m.columnNotebookShort },
];

export const SchoolClosedGroupCards = ({
  yearName,
  rows,
  messages,
}: SchoolClosedGroupCardsProps) => {
  const schoolMessages = messages.school;
  const yearMessages = messages.years;

  return (
    <ul
      className="space-y-3 lg:hidden"
      aria-label={fillMessage(schoolMessages.closedTableCaption, { year: yearName })}
    >
      {rows.map((row) => {
        if (!row.hadGroupInYear) {
          return (
            <RecordCard
              key={row.gradeId}
              title={row.gradeName}
              note={schoolMessages.noGroupInYear}
            />
          );
        }
        return (
          <RecordCard
            key={row.gradeId}
            title={row.gradeName}
            fields={[
              {
                label: schoolMessages.columnKidsSample,
                value: row.totals?.kids ?? messages.kpiEmpty,
              },
              {
                label: schoolMessages.columnLessonsChecked,
                value: row.totals?.lessons ?? messages.kpiEmpty,
              },
              ...METRIC_COLS.map(({ key, label }) => ({
                label: label(schoolMessages),
                value: (
                  <>
                    <span className="tabular-nums">{formatYearMetricValue(key, row.totals, messages)}</span>
                    <span className="block text-sm font-normal text-ink-2">
                      <DiffBadge
                        metric={key}
                        delta={row.diff?.[key] ?? null}
                        hasPreviousYear={row.hasPreviousYear}
                        comparisonReliable={row.comparisonReliable}
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
};
