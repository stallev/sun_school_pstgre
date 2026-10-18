import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { StatusText } from "@/components/ui/status-text";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SchoolGroupRow } from "@/data/analytics/load-school-analytics-page.server";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type SchoolGroupsTableProps = {
  rows: SchoolGroupRow[];
  messages: AnalyticsMessages["school"];
  formatPercent: (value: number) => string;
};

export const SchoolGroupsTable = ({ rows, messages, formatPercent }: SchoolGroupsTableProps) => (
  <section className="space-y-2">
    <SectionTitle as="h2" className="text-lg">{messages.groupsTableTitle}</SectionTitle>
    <ContentText className="text-sm text-muted-foreground">{messages.groupsTableHint}</ContentText>
    <Card className="overflow-x-auto p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">{messages.columnGroup}</TableHead>
            <TableHead scope="col">{messages.columnTeachers}</TableHead>
            <TableHead scope="col" className="text-right">{messages.columnPupils}</TableHead>
            <TableHead scope="col" className="text-right">{messages.columnAttendance}</TableHead>
            <TableHead scope="col" className="text-right">{messages.columnAverage}</TableHead>
            <TableHead scope="col">{messages.columnLastLesson}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const lastLabel =
              row.lastLessonStatus === "ok"
                ? messages.lastLessonOk(row.lastLessonLabel)
                : row.lastLessonStatus === "warn"
                  ? messages.lastLessonWarn(row.lastLessonLabel)
                  : messages.lastLessonIdle;
            const lastTone =
              row.lastLessonStatus === "ok" ? "ok" : row.lastLessonStatus === "warn" ? "warn" : "neutral";
            return (
              <TableRow key={row.gradeId}>
                <TableCell className="font-medium">{row.gradeName}</TableCell>
                <TableCell className="text-sm text-ink-2">{row.teacherNames}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.layerACount}
                  <span className="text-muted-foreground"> / {row.totalPupils}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.attendancePercent === null ? "—" : formatPercent(row.attendancePercent)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.testAverage}</TableCell>
                <TableCell>
                  <StatusText tone={lastTone}>{lastLabel}</StatusText>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  </section>
);
