"use client";

import type { LessonKind, LessonVerseToRecite, ScoringSnapshot } from "@sunschool/domain";
import { NumberDisplay } from "@/components/atoms";
import { ScoreCell } from "@/components/ui/score-cell";
import { StatusText } from "@/components/ui/status-text";
import { CustomLink } from "@/components/ui/custom-link";
import { TableCell, TableRow } from "@/components/ui/table";
import { LateBadge } from "@/components/teacher/LateBadge";
import { LessonCheckPressToggle } from "@/components/teacher/LessonCheckPressToggle";
import type { LessonTablePupilRow } from "@/data/checks/load-lesson-table-page.server";
import { formatLessonCheckRowTotal } from "@/lib/check/lesson-check-row-total-display";
import { lessonCheckTableConflictCellOutline } from "@/lib/check/lesson-check-table-conflict-outline";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";
import { fillMessage } from "@/lib/messages/fill-message";
import { cn } from "@/lib/utils";

export type LessonCheckTableRowProps = {
  index: number;
  row: LessonTablePupilRow;
  lessonId: string;
  lessonKind: LessonKind;
  scoring: ScoringSnapshot;
  hasTest: boolean;
  versesToRecite: readonly LessonVerseToRecite[];
  readOnly: boolean;
  busyCells: ReadonlySet<string>;
  hasConflict: boolean;
  messages: TeacherCheckMessages;
  openCellKey: string | null;
  onOpenCellKeyChange: (key: string | null) => void;
  onPresentChange: (present: boolean) => void;
  onSingingChange: (singing: boolean) => void;
  onTestScoreChange: (score: number | null) => void;
  onNotebookScoreChange: (score: number | null) => void;
  onVerseScoreChange: (lessonVerseId: string, score: number | null) => void;
};

const stickyCell = "sticky z-10 bg-card";

const conflictCell = (hasConflict: boolean, position: "first" | "middle" | "last") =>
  hasConflict ? lessonCheckTableConflictCellOutline(position) : undefined;

export const LessonCheckTableRow = ({
  index,
  row,
  lessonId,
  lessonKind,
  scoring,
  hasTest,
  versesToRecite,
  readOnly,
  busyCells,
  hasConflict,
  messages,
  openCellKey,
  onOpenCellKeyChange,
  onPresentChange,
  onSingingChange,
  onTestScoreChange,
  onNotebookScoreChange,
  onVerseScoreChange,
}: LessonCheckTableRowProps) => {
  const href = `/lessons/${lessonId}/check?pupil=${row.pupilId}`;
  const statusLabel = !row.homeworkChecked
    ? messages.tableLegendUnchecked
    : !row.present
      ? messages.tableLegendAbsent
      : null;
  const totalDisplay = formatLessonCheckRowTotal(row, lessonKind, versesToRecite, scoring);

  return (
    <TableRow>
      <TableCell
        className={cn("pl-4 tabular-nums text-muted-foreground", conflictCell(hasConflict, "first"))}
      >
        {index + 1}
      </TableCell>
      <TableCell className={cn(stickyCell, "left-0 font-medium", conflictCell(hasConflict, "middle"))}>
        <CustomLink href={href} className="text-cobalt-ink">
          {row.displayName}
        </CustomLink>
        <span className="mt-0.5 flex flex-wrap items-center gap-2">
          {statusLabel ? (
            <StatusText tone={!row.homeworkChecked ? "warn" : "neutral"}>{statusLabel}</StatusText>
          ) : null}
          {row.late ? <LateBadge label={messages.lateSubmitted} /> : null}
        </span>
        {hasConflict ? <p className="mt-1 text-sm text-danger">{messages.conflictTitle}</p> : null}
      </TableCell>
      <TableCell className={cn("text-center", conflictCell(hasConflict, "middle"))}>
        <LessonCheckPressToggle
          pressed={row.present}
          label={`${messages.presentLabel}: ${row.displayName}`}
          disabled={readOnly}
          busy={busyCells.has(`${row.pupilId}:present`)}
         
          onPressedChange={onPresentChange}
        />
      </TableCell>
      {versesToRecite.map((verse) => (
        <TableCell
          key={verse.lessonVerseId}
          className={cn("text-center", conflictCell(hasConflict, "middle"))}
        >
          <ScoreCell
            mode="verse"
            max={2}
            value={row.verseScores[verse.lessonVerseId] ?? null}
            notRatedLabel={messages.scoreNotRated}
            cellKey={`${row.pupilId}:verse:${verse.lessonVerseId}`}
            openCellKey={openCellKey}
            onOpenCellKeyChange={onOpenCellKeyChange}
            aria-label={`${fillMessage(messages.verseLabel, { position: verse.position })}: ${row.displayName}`}
            disabled={readOnly}
            aria-busy={busyCells.has(`${row.pupilId}:verse:${verse.lessonVerseId}`)}
            onValueChange={(score) => onVerseScoreChange(verse.lessonVerseId, score)}
          />
        </TableCell>
      ))}
      {hasTest ? (
        <TableCell className={cn("text-center", conflictCell(hasConflict, "middle"))}>
          <ScoreCell
            mode="pad"
            max={10}
            value={row.testScore}
            notRatedLabel={messages.scoreNotRated}
            cellKey={`${row.pupilId}:test`}
            openCellKey={openCellKey}
            onOpenCellKeyChange={onOpenCellKeyChange}
            aria-label={`${messages.testLabel}: ${row.displayName}`}
            disabled={readOnly}
            aria-busy={busyCells.has(`${row.pupilId}:test`)}
            onValueChange={onTestScoreChange}
          />
        </TableCell>
      ) : null}
      <TableCell className={cn("text-center", conflictCell(hasConflict, "middle"))}>
        <ScoreCell
          mode="pad"
          max={10}
          value={row.notebookScore}
          notRatedLabel={messages.scoreNotRated}
          cellKey={`${row.pupilId}:notebook`}
          openCellKey={openCellKey}
          onOpenCellKeyChange={onOpenCellKeyChange}
          aria-label={`${messages.notebookLabel}: ${row.displayName}`}
          disabled={readOnly}
          aria-busy={busyCells.has(`${row.pupilId}:notebook`)}
          onValueChange={onNotebookScoreChange}
        />
      </TableCell>
      <TableCell className={cn("text-center", conflictCell(hasConflict, "middle"))}>
        <LessonCheckPressToggle
          pressed={row.singing}
          label={`${messages.singingLabel}: ${row.displayName}`}
          disabled={readOnly}
          busy={busyCells.has(`${row.pupilId}:singing`)}
         
          onPressedChange={onSingingChange}
        />
      </TableCell>
      <TableCell className={cn(stickyCell, "right-0 text-right", conflictCell(hasConflict, "last"))}>
        <NumberDisplay className="font-display text-base tabular-nums">{totalDisplay}</NumberDisplay>
      </TableCell>
    </TableRow>
  );
};
