import { StatusText } from "@/components/ui/status-text";
import { RecordCard } from "@/components/patterns/RecordCard";
import type { SchoolGroupRow } from "@/data/analytics/load-school-analytics-page.server";
import {
  formatAnalyticsAverage,
  formatAnalyticsPercent,
} from "@/lib/analytics/format-analytics-display";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type SchoolGroupCardsProps = {
  rows: SchoolGroupRow[];
  messages: AnalyticsMessages["school"];
  percentTemplate: string;
  averageTemplate: string;
};

const attendanceLabel = (row: SchoolGroupRow, percentTemplate: string): string | null => {
  if (row.attendancePercent === null) return null;
  return formatAnalyticsPercent(percentTemplate, Math.round(row.attendancePercent));
};

export const SchoolGroupCards = ({
  rows,
  messages,
  percentTemplate,
  averageTemplate,
}: SchoolGroupCardsProps) => (
  <ul className="space-y-3 lg:hidden" aria-label={messages.groupsTableTitle}>
    {rows.map((row) => {
      const lastLabel =
        row.lastLessonStatus === "ok"
          ? fillMessage(messages.lastLessonOk, { label: row.lastLessonLabel })
          : row.lastLessonStatus === "warn"
            ? fillMessage(messages.lastLessonWarn, { label: row.lastLessonLabel })
            : messages.lastLessonIdle;
      const lastTone =
        row.lastLessonStatus === "ok" ? "ok" : row.lastLessonStatus === "warn" ? "warn" : "neutral";
      const rounded = row.attendancePercent === null ? null : Math.round(row.attendancePercent);
      const percent = attendanceLabel(row, percentTemplate);
      return (
        <RecordCard
          key={row.gradeId}
          title={row.gradeName}
          fields={[
            { label: messages.columnTeachers, value: row.teacherNames, wide: true },
            {
              label: messages.columnPupils,
              value: (
                <span className="tabular-nums">
                  {row.layerACount}
                  <span className="text-muted-foreground"> / {row.totalPupils}</span>
                </span>
              ),
            },
            {
              label: messages.columnAverage,
              value:
                row.scoreAverage === "—"
                  ? row.scoreAverage
                  : formatAnalyticsAverage(averageTemplate, Number(row.scoreAverage)),
            },
            {
              label: messages.columnAttendance,
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
