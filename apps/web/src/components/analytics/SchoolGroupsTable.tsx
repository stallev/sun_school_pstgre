import { ContentText } from "@/components/atoms/ContentText";
import { StatusText } from "@/components/ui/status-text";
import { Card } from "@/components/ui/card";
import { SchoolGroupCards } from "@/components/analytics/SchoolGroupCards";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SchoolGroupRow } from "@/data/analytics/load-school-analytics-page.server";
import {
  formatAnalyticsAverage,
  formatAnalyticsPercent,
} from "@/lib/analytics/format-analytics-display";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type SchoolGroupsTableProps = {
  rows: SchoolGroupRow[];
  messages: AnalyticsMessages["school"];
  percentTemplate: string;
  averageTemplate: string;
};

export const SchoolGroupsTable = ({
  rows,
  messages,
  percentTemplate,
  averageTemplate,
}: SchoolGroupsTableProps) => (
  <section className="min-w-0 space-y-3">
    <SchoolGroupCards
      rows={rows}
      messages={messages}
      percentTemplate={percentTemplate}
      averageTemplate={averageTemplate}
    />
    <Card className="hidden p-0 lg:block">
      <Table className="text-left text-base">
        <caption className="sr-only">{messages.groupsTableTitle}</caption>
        <TableHeader className="border-b border-line text-sm text-muted-foreground">
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="px-5 py-3 font-normal">
              {messages.columnGroup}
            </TableHead>
            <TableHead scope="col" className="px-3 py-3 font-normal">
              {messages.columnTeachers}
            </TableHead>
            <TableHead scope="col" className="px-3 py-3 text-right font-normal">
              {messages.columnPupils}
            </TableHead>
            <TableHead scope="col" className="w-48 px-3 py-3 font-normal">
              {messages.columnAttendance}
            </TableHead>
            <TableHead scope="col" className="px-3 py-3 text-right font-normal">
              {messages.columnAverage}
            </TableHead>
            <TableHead scope="col" className="px-5 py-3 font-normal">
              {messages.columnLastLesson}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-line">
          {rows.map((row) => {
            const lastLabel =
              row.lastLessonStatus === "ok"
                ? fillMessage(messages.lastLessonOk, { label: row.lastLessonLabel })
                : row.lastLessonStatus === "warn"
                  ? fillMessage(messages.lastLessonWarn, { label: row.lastLessonLabel })
                  : messages.lastLessonIdle;
            const lastTone =
              row.lastLessonStatus === "ok" ? "ok" : row.lastLessonStatus === "warn" ? "warn" : "neutral";
            const attendanceRounded =
              row.attendancePercent === null ? null : Math.round(row.attendancePercent);
            const attendanceLabel =
              attendanceRounded === null
                ? "—"
                : formatAnalyticsPercent(percentTemplate, attendanceRounded);
            return (
              <TableRow key={row.gradeId}>
                <TableCell className="px-5 py-4 font-medium">{row.gradeName}</TableCell>
                <TableCell className="px-3 py-4 text-base text-ink-2">{row.teacherNames}</TableCell>
                <TableCell className="px-3 py-4 text-right tabular-nums">
                  {row.layerACount}
                  <span className="text-muted-foreground"> / {row.totalPupils}</span>
                </TableCell>
                <TableCell className="px-3 py-4">
                  {attendanceRounded === null ? (
                    <span className="text-sm tabular-nums">—</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div
                          className="h-1.5 w-full overflow-hidden rounded-full bg-line"
                          role="progressbar"
                          aria-valuenow={attendanceRounded}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${messages.columnAttendance}: ${row.gradeName}`}
                        >
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${attendanceRounded}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-10 text-right text-sm tabular-nums">{attendanceLabel}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="px-3 py-4 text-right tabular-nums">
                  {row.scoreAverage === "—"
                    ? row.scoreAverage
                    : formatAnalyticsAverage(averageTemplate, Number(row.scoreAverage))}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <StatusText tone={lastTone}>{lastLabel}</StatusText>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
    <ContentText className="text-sm text-muted-foreground">{messages.groupsTableHint}</ContentText>
  </section>
);
