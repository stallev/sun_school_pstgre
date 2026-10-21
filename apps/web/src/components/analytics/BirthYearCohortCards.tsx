import { RecordCard } from "@/components/patterns/RecordCard";
import type { BirthYearCohortRow } from "@/lib/analytics/build-birth-year-cohort-rows";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { formatCohortAverage, formatCohortPercent } from "./format-group-score";

type BirthYearCohortCardsProps = {
  rows: readonly BirthYearCohortRow[];
  messages: AnalyticsMessages;
};

export const BirthYearCohortCards = ({ rows, messages }: BirthYearCohortCardsProps) => {
  const tables = messages.tables;
  return (
    <ul className="space-y-3 lg:hidden" aria-label={tables.layerBirthYearTitle}>
      {rows.map((row) => (
        <RecordCard
          key={row.birthYear ?? "unknown"}
          title={row.birthYear ?? messages.kpiEmpty}
          fields={[
            { label: tables.columnBirthYearKids, value: row.pupilCount },
            { label: tables.columnAttendance, value: formatCohortPercent(row.attendancePercent, messages) },
            { label: tables.columnVerses, value: formatCohortAverage(row.versesAverage, messages) },
            { label: tables.columnTest, value: formatCohortAverage(row.testAverage, messages) },
            { label: tables.columnNotebook, value: formatCohortAverage(row.notebookAverage, messages) },
          ]}
        />
      ))}
    </ul>
  );
};
