import type { LessonKind, LessonVerseToRecite, ScoringSnapshot } from "@sunschool/domain";
import { CheckIcon } from "lucide-react";
import { LessonLeaderMark } from "@/components/teacher/LessonLeaderMark";
import { TableCell, TableRow } from "@/components/ui/table";
import type { LessonTablePupilRow } from "@/data/checks/load-lesson-table-page.server";
import { formatLessonCheckRowTotal } from "@/lib/check/lesson-check-row-total-display";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";
import { cn } from "@/lib/utils";

type LessonSheetRowProps = {
  index: number;
  row: LessonTablePupilRow;
  lessonKind: LessonKind;
  scoring: ScoringSnapshot;
  hasTest: boolean;
  versesToRecite: readonly LessonVerseToRecite[];
  isTopScorer: boolean;
  messages: TeacherCheckMessages;
};

const cell = "px-1 py-0 text-center";

/** Status colours fall below 4.5:1 on `gold-soft`, so leader rows use `ink` / `ink-2` only (UX-03 D-16). */
const scoreClass = (value: number | null, max: number, isTopScorer: boolean): string => {
  if (value === null) return isTopScorer ? "text-ink-2" : "text-muted-foreground";
  if (isTopScorer || max <= 2) return "text-ink";
  if (value >= 8) return "text-ok";
  return value <= 4 ? "text-danger" : "text-ink";
};

export const LessonSheetRow = ({
  index,
  row,
  lessonKind,
  scoring,
  hasTest,
  versesToRecite,
  isTopScorer,
  messages,
}: LessonSheetRowProps) => {
  const score = (value: number | null, max: number) => (
    <span className={scoreClass(value, max, isTopScorer)}>{value ?? "—"}</span>
  );
  const yes = (on: boolean) =>
    on ? (
      <span className="inline-flex text-ok">
        <CheckIcon className="size-4" aria-hidden />
        <span className="sr-only">{messages.sheetYes}</span>
      </span>
    ) : (
      <span className={isTopScorer ? "text-ink-2" : "text-muted-foreground"}>—</span>
    );

  return (
    <TableRow className={cn("sheet-row", isTopScorer && "bg-gold-soft hover:bg-gold-soft")}>
      <TableCell
        className={cn(
          "py-0 pl-3 tabular-nums",
          isTopScorer ? "border-l-4 border-gold text-ink-2" : "text-muted-foreground",
        )}
      >
        {index + 1}
      </TableCell>
      <TableCell className="truncate px-1 py-0 font-medium">
        {row.displayName}
        {row.late ? (
          <span className={isTopScorer ? "text-ink" : "text-amber-ink"} title={messages.lateSubmitted} aria-label={messages.lateSubmitted}>
            {" *"}
          </span>
        ) : null}
        {isTopScorer ? <LessonLeaderMark label={messages.topScorer} /> : null}
        {!row.homeworkChecked ? (
          <span className="ml-1 text-sm font-normal text-warn">{messages.tableLegendUnchecked}</span>
        ) : null}
      </TableCell>
      <TableCell className={cell}>{yes(row.present)}</TableCell>
      {versesToRecite.map((verse) => (
        <TableCell key={verse.lessonVerseId} className={cell}>
          {score(row.verseScores[verse.lessonVerseId] ?? null, 2)}
        </TableCell>
      ))}
      {hasTest ? <TableCell className={cell}>{score(row.testScore, 10)}</TableCell> : null}
      <TableCell className={cell}>{score(row.notebookScore, 10)}</TableCell>
      <TableCell className={cell}>{yes(row.singing)}</TableCell>
      <TableCell className="py-0 pr-3 text-right font-display text-base font-medium tabular-nums">
        {formatLessonCheckRowTotal(row, lessonKind, versesToRecite, scoring)}
      </TableCell>
    </TableRow>
  );
};
