import { CustomLink } from "@/components/ui/custom-link";
import { RecordCard } from "@/components/patterns/RecordCard";
import type { GroupAnalyticsPupilRow } from "@/data/analytics/analytics-compute.server";
import {
  formatAnalyticsPercent,
  formatAnalyticsShortDate,
} from "@/lib/analytics/format-analytics-display";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { formatGroupScore } from "./format-group-score";

type PupilLayerVariant = "layer-a" | "layer-b" | "layer-c" | "layer-d";

type PupilLayerCardsProps = {
  rows: GroupAnalyticsPupilRow[];
  messages: AnalyticsMessages;
  variant: PupilLayerVariant;
  locale: string;
};

const attendanceValue = (row: GroupAnalyticsPupilRow, messages: AnalyticsMessages): string =>
  row.attendanceRate === null
    ? messages.kpiEmpty
    : formatAnalyticsPercent(messages.formatPercent, Number(row.attendanceRate.toFixed(1)));

const pupilFields = (
  row: GroupAnalyticsPupilRow,
  messages: AnalyticsMessages,
  variant: PupilLayerVariant,
  locale: string,
) => {
  const tables = messages.tables;
  if (variant === "layer-a") {
    return [
      { label: tables.columnBirthYear, value: row.birthYear ?? messages.kpiEmpty },
      { label: tables.columnAttendance, value: attendanceValue(row, messages) },
      {
        label: tables.columnAttendedChecked,
        value: fillMessage(tables.attendedCheckedValue, {
          attended: row.attendedLessonCount,
          checked: row.checkedLessonCount,
        }),
      },
      {
        label: tables.columnVerses,
        value: formatGroupScore(row.versesAverage.average, row.versesAverage.observationCount, messages),
      },
      {
        label: tables.columnTest,
        value: formatGroupScore(row.testAverage.average, row.testAverage.observationCount, messages),
      },
      {
        label: tables.columnNotebook,
        value: formatGroupScore(row.notebookAverage.average, row.notebookAverage.observationCount, messages),
      },
    ];
  }
  if (variant === "layer-b") {
    return [
      { label: tables.columnBirthYear, value: row.birthYear ?? messages.kpiEmpty },
      { label: tables.columnAttended, value: row.attendedLessonCount },
      { label: tables.columnCheckedLessons, value: row.checkedLessonCount },
      { label: tables.columnAttendance, value: attendanceValue(row, messages) },
    ];
  }
  if (variant === "layer-d") {
    return [
      {
        label: tables.columnEnrolledSince,
        value: formatAnalyticsShortDate(row.enrolledSinceIso, locale),
      },
    ];
  }
  return [{ label: tables.columnBirthYear, value: row.birthYear ?? messages.kpiEmpty }];
};

export const PupilLayerCards = ({ rows, messages, variant, locale }: PupilLayerCardsProps) => (
  <ul className="space-y-2 lg:space-y-3 lg:hidden" aria-label={messages.tables.columnName}>
    {rows.map((row) => (
      <RecordCard
        cardType="analytics"
        key={row.pupilId}
        title={
          <CustomLink href={`/analytics/pupils/${row.pupilId}`} className="hover:text-cobalt-ink">
            {row.displayName}
          </CustomLink>
        }
        fields={pupilFields(row, messages, variant, locale)}
      />
    ))}
  </ul>
);
