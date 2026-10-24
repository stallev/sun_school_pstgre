import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AnalyticsMessages, AnalyticsPupilYearMessages, AnalyticsYearMessages } from "@/lib/messages/analytics-messages";
import type { PupilYearTableRow } from "./PupilYearsSection";
import { fillMessage } from "@/lib/messages/fill-message";
import { formatPupilYearMetric } from "./format-pupil-year-metric";
import { PupilYearsCards } from "./PupilYearsCards";

type PupilYearsRowsTableProps = {
  rows: readonly PupilYearTableRow[];
  selectedYearId: string;
  onSelectYear: (yearId: string) => void;
  messages: AnalyticsMessages;
  pupilYearMessages: AnalyticsPupilYearMessages;
  yearMessages: AnalyticsYearMessages;
  showForeignGroupNote: boolean;
};

export const PupilYearsRowsTable = ({
  rows,
  selectedYearId,
  onSelectYear,
  messages,
  pupilYearMessages,
  yearMessages,
  showForeignGroupNote,
}: PupilYearsRowsTableProps) => (
  <>
    <PupilYearsCards
      rows={rows}
      selectedYearId={selectedYearId}
      onSelectYear={onSelectYear}
      messages={messages}
      pupilYearMessages={pupilYearMessages}
      yearMessages={yearMessages}
    />
    <Card className="hidden p-0 lg:block">
      <Table className="text-left text-base">
        <caption className="sr-only">{pupilYearMessages.tableCaption}</caption>
        <TableHeader className="border-b border-line text-sm text-muted">
          <TableRow>
            <TableHead scope="col" className="px-5 py-3 font-normal">
              {yearMessages.columnYear}
            </TableHead>
            <TableHead scope="col" className="px-3 py-3 font-normal">
              {pupilYearMessages.columnGroup}
            </TableHead>
            <TableHead scope="col" className="px-3 py-3 text-right font-normal">
              {yearMessages.columnAttendance}
            </TableHead>
            <TableHead scope="col" className="px-3 py-3 text-right font-normal">
              {yearMessages.columnVerses}
            </TableHead>
            <TableHead scope="col" className="px-3 py-3 text-right font-normal">
              {yearMessages.columnTest}
            </TableHead>
            <TableHead scope="col" className="px-3 py-3 text-right font-normal">
              {yearMessages.columnNotebook}
            </TableHead>
            <TableHead scope="col" className="px-5 py-3 text-right font-normal">
              {pupilYearMessages.columnBricks}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-line">
          {rows.map((row) => {
            const selected = row.yearId === selectedYearId;
            const dash = row.insufficientLessons;
            return (
              <TableRow key={row.yearId} className={cn("hover:bg-transparent", selected && "bg-paper")}>
                <TableHead scope="row" className="px-5 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => onSelectYear(row.yearId)}
                    aria-current={selected ? "true" : undefined}
                    className="text-left hover:text-cobalt-ink"
                  >
                    {row.yearName}
                  </button>
                  {dash && (
                    <span className="block text-sm font-normal text-muted">
                      {fillMessage(pupilYearMessages.fewLessons, { count: row.lessons })}
                    </span>
                  )}
                </TableHead>
                <TableCell className="px-3 py-3">{row.gradeLabels}</TableCell>
                {(["attendance", "verses", "test", "notebook"] as const).map((key) => (
                  <TableCell key={key} className="px-3 py-3 text-right tabular-nums">
                    {dash || row[key] === null
                      ? messages.kpiEmpty
                      : formatPupilYearMetric(key, row[key] as number, messages)}
                  </TableCell>
                ))}
                <TableCell className="px-5 py-3 text-right tabular-nums">
                  {fillMessage(pupilYearMessages.bricksRatio, {
                    earned: row.bricksEarned,
                    issued: row.bricksIssued,
                  })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
    {showForeignGroupNote && (
      <ContentText className="mt-2 text-sm text-muted">
        {pupilYearMessages.foreignGroupNote}
      </ContentText>
    )}
  </>
);
