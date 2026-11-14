import { StatusText } from "@/components/ui/status-text";
import { nonEmptyTerm } from "@/components/ui/non-empty-term";
import { TermLabel } from "@/components/ui/term-label";
import { RecordCard } from "@/components/patterns/RecordCard";
import type { SchoolGroupRow } from "@/data/analytics/load-school-analytics-page.server";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";
import {
  formatAnalyticsPercent,
} from "@/lib/analytics/format-analytics-display";
import {
  formatSchoolGroupScoreAverage,
  formatSchoolLastLessonLabel,
} from "@/lib/analytics/analytics-metric-copy";
import { fillMessage } from "@/lib/messages/fill-message";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type SchoolTableHints = {
  regularAttendance: HintTerm;
  attendanceRate: HintTerm;
  averageScore: HintTerm;
};

type SchoolGroupCardsProps = {
  rows: SchoolGroupRow[];
  messages: AnalyticsMessages["school"];
  percentTemplate: string;
  averageTemplate: string;
  formatLocale: MessageLocale;
  tableHints: SchoolTableHints;
  termHintAriaLabel: string;
};

/** ADR-022 §4.7: «?» once per screen — only the first card carries the hint, same keys as the table header. */
const metricLabel = (hint: HintTerm, withHint: boolean, termHintAriaLabel: string) =>
  withHint ? (
    <TermLabel
      term={nonEmptyTerm(hint.term)}
      hint={hint.hint}
      ariaLabel={fillMessage(termHintAriaLabel, { term: hint.term })}
    />
  ) : (
    hint.term
  );

const attendanceLabel = (row: SchoolGroupRow, percentTemplate: string): string | null => {
  if (row.attendancePercent === null) return null;
  return formatAnalyticsPercent(percentTemplate, row.attendancePercent / 100);
};

export const SchoolGroupCards = ({
  rows,
  messages,
  percentTemplate,
  averageTemplate,
  formatLocale,
  tableHints,
  termHintAriaLabel,
}: SchoolGroupCardsProps) => (
  <ul className="space-y-2 lg:space-y-3 lg:hidden" aria-label={messages.groupsTableTitle}>
    {rows.map((row, index) => {
      const isFirst = index === 0;
      const lastLabel = formatSchoolLastLessonLabel(row, messages);
      const lastTone =
        row.lastLessonStatus === "ok" ? "ok" : row.lastLessonStatus === "warn" ? "warn" : "neutral";
      const rounded = row.attendancePercent === null ? null : Math.round(row.attendancePercent);
      const percent = attendanceLabel(row, percentTemplate);
      return (
        <RecordCard
          cardType="analytics"
          key={row.gradeId}
          title={row.gradeName}
          fields={[
            { label: messages.columnTeachers, value: row.teacherNames, wide: true },
            {
              label: metricLabel(tableHints.regularAttendance, isFirst, termHintAriaLabel),
              value: (
                <span className="tabular-nums">
                  {fillMessage(messages.pupilsSampleValue, {
                    current: row.layerACount,
                    total: row.totalPupils,
                  })}
                </span>
              ),
            },
            {
              label: metricLabel(tableHints.averageScore, isFirst, termHintAriaLabel),
              value: formatSchoolGroupScoreAverage(
                row.scoreAverage,
                averageTemplate,
                formatLocale,
                "—",
              ),
            },
            {
              label: metricLabel(tableHints.attendanceRate, isFirst, termHintAriaLabel),
              value:
                rounded === null || percent === null ? (
                  "—"
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-line">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${rounded}%` }}
                      />
                    </span>
                    <span className="tabular-nums">{percent}</span>
                  </span>
                ),
              wide: true,
            },
            {
              label: messages.columnLastLesson,
              value: <StatusText tone={lastTone}>{lastLabel}</StatusText>,
              wide: true,
            },
          ]}
        />
      );
    })}
  </ul>
);
