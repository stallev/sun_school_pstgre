import { ACADEMIC_YEAR_STATUS, ANALYTICS_METHODOLOGY_VERSION } from "@sunschool/domain";
import type { AcademicYearStatus, GroupYearTotals, YearMetricDiff } from "@sunschool/domain";
import { SectionTitle } from "@/components/atoms/SectionTitle";
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
import type { AnalyticsMessages, AnalyticsYearMessages } from "@/lib/messages/analytics-messages";
import { DiffBadge, type YearDiffMetric } from "./DiffBadge";

export type YearTotalsTableRow = {
  yearId: string;
  yearName: string;
  status: AcademicYearStatus;
  methodologyVersion: string;
  totals: GroupYearTotals | null;
  diff: YearMetricDiff | null;
  comparisonReliable: boolean;
  previousYearName?: string;
};

type YearTotalsTableProps = {
  groupLabel: string;
  rows: readonly YearTotalsTableRow[];
  selectedYearId: string;
  onSelectYear: (yearId: string) => void;
  messages: AnalyticsMessages;
  yearMessages: AnalyticsYearMessages;
};

const METRIC_COLS: { key: YearDiffMetric; label: (m: AnalyticsYearMessages) => string }[] = [
  { key: "attendance", label: (m) => m.columnAttendance },
  { key: "verses", label: (m) => m.columnVerses },
  { key: "test", label: (m) => m.columnTest },
  { key: "notebook", label: (m) => m.columnNotebook },
];

const cellValue = (
  key: YearDiffMetric,
  totals: GroupYearTotals | null,
  messages: AnalyticsMessages,
): string => {
  if (!totals) return messages.kpiEmpty;
  const value = totals[key];
  if (value === null) return messages.kpiEmpty;
  if (key === "attendance") return messages.formatPercent(Number((value * 100).toFixed(0)));
  return messages.formatAverage(Number(value.toFixed(1)));
};

export const YearTotalsTable = ({
  groupLabel,
  rows,
  selectedYearId,
  onSelectYear,
  messages,
  yearMessages,
}: YearTotalsTableProps) => (
  <section className="mb-6">
    <SectionTitle as="h2" className="mb-1">
      {yearMessages.title}
    </SectionTitle>
    <ContentText className="mb-3 text-sm text-ink-2">{yearMessages.compositionNote}</ContentText>
    <Card className="overflow-x-auto">
      <Table className="min-w-[46rem] text-left">
        <caption className="sr-only">{yearMessages.tableCaption(groupLabel)}</caption>
        <TableHeader className="border-b border-line text-sm text-muted-foreground">
          <TableRow>
            <TableHead scope="col" className="px-5 py-3 font-normal">
              {yearMessages.columnYear}
            </TableHead>
            <TableHead scope="col" className="px-3 py-3 text-right font-normal">
              {yearMessages.columnKids}
            </TableHead>
            <TableHead scope="col" className="px-3 py-3 text-right font-normal">
              {yearMessages.columnLessons}
            </TableHead>
            {METRIC_COLS.map(({ key, label }) => (
              <TableHead key={key} scope="col" className="px-3 py-3 text-right font-normal">
                {label(yearMessages)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-line">
          {rows.map((row) => {
            const selected = row.yearId === selectedYearId;
            const isActive = row.status === ACADEMIC_YEAR_STATUS.ACTIVE;
            const staleMethod =
              row.methodologyVersion !== ANALYTICS_METHODOLOGY_VERSION;
            return (
              <TableRow key={row.yearId} className={cn(selected && "bg-paper")}>
                <TableHead scope="row" className="px-5 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => onSelectYear(row.yearId)}
                    aria-current={selected ? "true" : undefined}
                    className="text-left hover:text-cobalt-ink"
                  >
                    {row.yearName}
                  </button>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {isActive ? yearMessages.activeBadge : yearMessages.closedBadge}
                    {staleMethod ? ` · ${yearMessages.methodologyBadge(row.methodologyVersion)}` : ""}
                  </span>
                </TableHead>
                <TableCell className="px-3 py-3 text-right tabular-nums">
                  {row.totals?.kids ?? messages.kpiEmpty}
                </TableCell>
                <TableCell className="px-3 py-3 text-right tabular-nums">
                  {row.totals?.lessons ?? messages.kpiEmpty}
                </TableCell>
                {METRIC_COLS.map(({ key }) => (
                  <TableCell key={key} className="px-3 py-3 text-right tabular-nums">
                    {cellValue(key, row.totals, messages)}
                    <span className="block text-xs font-normal text-ink-2">
                      <DiffBadge
                        metric={key}
                        delta={row.diff?.[key] ?? null}
                        comparisonReliable={row.comparisonReliable}
                        previousYearName={row.previousYearName}
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
  </section>
);
