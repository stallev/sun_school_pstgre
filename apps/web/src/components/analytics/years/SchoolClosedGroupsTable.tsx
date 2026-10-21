import type { SchoolGroupYearRow } from "@/data/analytics/years/list-school-year-totals";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ContentText } from "@/components/atoms/ContentText";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { DiffBadge, type YearDiffMetric } from "./DiffBadge";
import { formatYearMetricValue } from "./format-year-metric-value";
import { SchoolClosedGroupCards } from "./SchoolClosedGroupCards";

type SchoolClosedGroupsTableProps = {
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

export const SchoolClosedGroupsTable = ({
  yearName,
  rows,
  messages,
}: SchoolClosedGroupsTableProps) => {
  const schoolMessages = messages.school;
  const yearMessages = messages.years;

  return (
    <section className="space-y-3">
      <SchoolClosedGroupCards yearName={yearName} rows={rows} messages={messages} />
      <Card className="hidden p-0 lg:block">
        <Table className="text-left text-base">
          <caption className="sr-only">{fillMessage(schoolMessages.closedTableCaption, { year: yearName })}</caption>
          <TableHeader className="border-b border-line text-base text-muted-foreground">
            <TableRow>
              <TableHead scope="col" className="px-5 py-3 font-normal">
                {schoolMessages.columnGroup}
              </TableHead>
              <TableHead scope="col" className="px-3 py-3 text-right font-normal">
                {schoolMessages.columnKidsSample}
              </TableHead>
              <TableHead scope="col" className="px-3 py-3 text-right font-normal">
                {schoolMessages.columnLessonsChecked}
              </TableHead>
              {METRIC_COLS.map(({ key, label }) => (
                <TableHead key={key} scope="col" className="px-3 py-3 text-right font-normal">
                  {label(schoolMessages)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-line">
            {rows.map((row) => {
              const { hasPreviousYear, comparisonReliable } = row;
              if (!row.hadGroupInYear) {
                return (
                  <TableRow key={row.gradeId}>
                    <TableHead scope="row" className="px-5 py-4 font-medium">
                      {row.gradeName}
                    </TableHead>
                    <TableCell colSpan={6} className="px-3 py-4 text-sm text-muted-foreground">
                      {schoolMessages.noGroupInYear}
                    </TableCell>
                  </TableRow>
                );
              }
              return (
                <TableRow key={row.gradeId}>
                  <TableHead scope="row" className="px-5 py-4 font-medium">
                    {row.gradeName}
                  </TableHead>
                  <TableCell className="px-3 py-4 text-right tabular-nums">
                    {row.totals?.kids ?? messages.kpiEmpty}
                  </TableCell>
                  <TableCell className="px-3 py-4 text-right tabular-nums">
                    {row.totals?.lessons ?? messages.kpiEmpty}
                  </TableCell>
                  {METRIC_COLS.map(({ key }) => (
                    <TableCell key={key} className="px-3 py-4 text-right tabular-nums">
                      {formatYearMetricValue(key, row.totals, messages)}
                      <span className="block text-sm font-normal text-ink-2">
                        <DiffBadge
                          metric={key}
                          delta={row.diff?.[key] ?? null}
                          hasPreviousYear={hasPreviousYear}
                          comparisonReliable={comparisonReliable}
                          messages={yearMessages}
                        />
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      <ContentText className="text-sm text-muted-foreground">
        {schoolMessages.closedCompositionNote}
      </ContentText>
    </section>
  );
};
