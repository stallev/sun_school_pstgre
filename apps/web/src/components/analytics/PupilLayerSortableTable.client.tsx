"use client";

import { useMemo, useState } from "react";
import { ContentText } from "@/components/atoms/ContentText";
import { CustomLink } from "@/components/ui/custom-link";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GroupAnalyticsPupilRow } from "@/data/analytics/analytics-compute.server";
import { getPupilRowAttentionFlags } from "@/lib/analytics/pupil-row-attention";
import {
  formatAnalyticsAttendanceRate,
} from "@/lib/analytics/format-analytics-display";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import { fillMessage } from "@/lib/messages/fill-message";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { formatGroupScore } from "./format-group-score";

type SortKey =
  | "name"
  | "birthYear"
  | "attendance"
  | "attendedChecked"
  | "verses"
  | "test"
  | "notebook";

type PupilLayerSortableTableProps = {
  rows: GroupAnalyticsPupilRow[];
  messages: AnalyticsMessages;
  lowScoreHint?: HintTerm;
  termHintAriaLabel?: string;
};

const compareNullableNumber = (left: number | null, right: number | null): number => {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return left - right;
};

const sortRows = (rows: GroupAnalyticsPupilRow[], sortKey: SortKey, ascending: boolean) => {
  const direction = ascending ? 1 : -1;
  return [...rows].sort((left, right) => {
    let result = 0;
    switch (sortKey) {
      case "name":
        result = left.displayName.localeCompare(right.displayName, "ru");
        break;
      case "birthYear":
        result = compareNullableNumber(left.birthYear, right.birthYear);
        break;
      case "attendance":
        result = compareNullableNumber(left.attendanceRate, right.attendanceRate);
        break;
      case "attendedChecked":
        result = left.attendedLessonCount - right.attendedLessonCount;
        break;
      case "verses":
        result = compareNullableNumber(left.versesAverage.average, right.versesAverage.average);
        break;
      case "test":
        result = compareNullableNumber(left.testAverage.average, right.testAverage.average);
        break;
      case "notebook":
        result = compareNullableNumber(left.notebookAverage.average, right.notebookAverage.average);
        break;
      default:
        result = 0;
    }
    return result * direction;
  });
};

export const PupilLayerSortableTable = ({
  rows,
  messages,
  lowScoreHint,
  termHintAriaLabel,
}: PupilLayerSortableTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [ascending, setAscending] = useState(true);
  const sortedRows = useMemo(
    () => sortRows(rows, sortKey, ascending),
    [ascending, rows, sortKey],
  );

  const handleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setAscending((value) => !value);
      return;
    }
    setSortKey(nextKey);
    setAscending(true);
  };

  const sortLabel = (key: SortKey, label: string) => {
    const isActive = sortKey === key;
    const direction = isActive ? (ascending ? " ↑" : " ↓") : "";
    return `${label}${direction}`;
  };

  return (
    <Card className="hidden p-0 lg:block">
      <Table className="text-base">
        <TableHeader className="border-b border-line text-sm text-muted">
          <TableRow className="hover:bg-transparent">
            {(
              [
                ["name", messages.tables.columnName],
                ["birthYear", messages.tables.columnBirthYear],
                ["attendance", messages.tables.columnAttendance],
                ["attendedChecked", messages.tables.columnAttendedChecked],
                ["verses", messages.tables.columnVerses],
                ["test", messages.tables.columnTest],
                ["notebook", messages.tables.columnNotebook],
              ] as const
            ).map(([key, label], index) => (
              <TableHead
                key={key}
                scope="col"
                className={`px-3 py-3 font-normal ${index === 0 ? "px-5" : ""} ${index === 6 ? "px-5" : ""}`}
              >
                <button
                  type="button"
                  className="inline-flex items-center text-left hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  onClick={() => handleSort(key)}
                >
                  {sortLabel(key, label)}
                </button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-line">
          {sortedRows.map((row) => {
            const { isLowAttendance, isLowScore } = getPupilRowAttentionFlags(row);
            return (
              <TableRow key={row.pupilId} className="hover:bg-transparent">
                <TableCell className="px-5 py-3">
                  <CustomLink
                    href={`/analytics/pupils/${row.pupilId}`}
                    className="text-ink font-medium hover:text-cobalt-ink focus-visible:text-cobalt-ink"
                  >
                    {row.displayName}
                  </CustomLink>
                  {isLowAttendance || isLowScore ? (
                    <ContentText className="mt-1 flex flex-wrap items-center gap-x-1 text-sm text-danger">
                      {isLowAttendance ? messages.tables.rowLowAttendance : null}
                      {isLowAttendance && isLowScore ? " · " : null}
                      {isLowScore && lowScoreHint && termHintAriaLabel ? (
                        <TermLabel
                          term={nonEmptyTerm(lowScoreHint.term)}
                          hint={lowScoreHint.hint}
                          ariaLabel={fillMessage(termHintAriaLabel, { term: lowScoreHint.term })}
                        />
                      ) : isLowScore ? (
                        messages.tables.rowLowScore
                      ) : null}
                    </ContentText>
                  ) : null}
                </TableCell>
                <TableCell className="px-3 py-3">{row.birthYear ?? messages.kpiEmpty}</TableCell>
                <TableCell className={`px-3 py-3 ${isLowAttendance ? "text-danger" : ""}`}>
                  {formatAnalyticsAttendanceRate(
                    messages.formatPercent,
                    row.attendanceRate,
                    messages.kpiEmpty,
                  )}
                </TableCell>
                <TableCell className="px-3 py-3">
                  {fillMessage(messages.tables.attendedCheckedValue, {
                    attended: row.attendedLessonCount,
                    checked: row.checkedLessonCount,
                  })}
                </TableCell>
                <TableCell className="px-3 py-3">
                  {formatGroupScore(row.versesAverage.average, row.versesAverage.observationCount, messages)}
                </TableCell>
                <TableCell className={`px-3 py-3 ${isLowScore ? "text-danger" : ""}`}>
                  {formatGroupScore(row.testAverage.average, row.testAverage.observationCount, messages)}
                </TableCell>
                <TableCell className={`px-5 py-3 ${isLowScore ? "text-danger" : ""}`}>
                  {formatGroupScore(
                    row.notebookAverage.average,
                    row.notebookAverage.observationCount,
                    messages,
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
};
