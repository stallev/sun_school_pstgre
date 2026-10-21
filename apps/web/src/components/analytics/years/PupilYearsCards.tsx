import { RecordCard } from "@/components/patterns/RecordCard";
import { fillMessage } from "@/lib/messages/fill-message";
import type {
  AnalyticsMessages,
  AnalyticsPupilYearMessages,
  AnalyticsYearMessages,
} from "@/lib/messages/analytics-messages";
import { formatPupilYearMetric } from "./format-pupil-year-metric";
import type { PupilYearTableRow } from "./PupilYearsSection";

type PupilYearsCardsProps = {
  rows: readonly PupilYearTableRow[];
  selectedYearId: string;
  onSelectYear: (yearId: string) => void;
  messages: AnalyticsMessages;
  pupilYearMessages: AnalyticsPupilYearMessages;
  yearMessages: AnalyticsYearMessages;
};

const metricValue = (
  dash: boolean,
  value: number | null,
  key: "attendance" | "verses" | "test" | "notebook",
  messages: AnalyticsMessages,
): string => (dash || value === null ? messages.kpiEmpty : formatPupilYearMetric(key, value, messages));

export const PupilYearsCards = ({
  rows,
  selectedYearId,
  onSelectYear,
  messages,
  pupilYearMessages,
  yearMessages,
}: PupilYearsCardsProps) => (
  <ul className="space-y-2 lg:space-y-3 lg:hidden" aria-label={pupilYearMessages.tableCaption}>
    {rows.map((row) => {
      const selected = row.yearId === selectedYearId;
      const dash = row.insufficientLessons;
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
              {dash ? (
                <span className="block text-base font-normal text-muted">
                  {fillMessage(pupilYearMessages.fewLessons, { count: row.lessons })}
                </span>
              ) : null}
            </button>
          }
          fields={[
            { label: pupilYearMessages.columnGroup, value: row.gradeLabels, wide: true },
            { label: yearMessages.columnAttendance, value: metricValue(dash, row.attendance, "attendance", messages) },
            { label: yearMessages.columnVerses, value: metricValue(dash, row.verses, "verses", messages) },
            { label: yearMessages.columnTest, value: metricValue(dash, row.test, "test", messages) },
            { label: yearMessages.columnNotebook, value: metricValue(dash, row.notebook, "notebook", messages) },
            {
              label: pupilYearMessages.columnBricks,
              value: fillMessage(pupilYearMessages.bricksRatio, {
                earned: row.bricksEarned,
                issued: row.bricksIssued,
              }),
              wide: true,
            },
          ]}
        />
      );
    })}
  </ul>
);
