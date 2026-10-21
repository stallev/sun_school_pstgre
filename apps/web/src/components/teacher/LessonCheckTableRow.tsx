"use client";

import type { LessonVerseToRecite } from "@sunschool/domain";
import { NumberDisplay } from "@/components/atoms";
import { ScoreCell } from "@/components/ui/score-cell";
import { ScorePad } from "@/components/ui/score-pad";
import { CustomLink } from "@/components/ui/custom-link";
import { TableCell, TableRow } from "@/components/ui/table";
import { LateBadge } from "@/components/teacher/LateBadge";
import type { LessonTablePupilRow } from "@/data/checks/load-lesson-table-page.server";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";
import { fillMessage } from "@/lib/messages/fill-message";
import { cn } from "@/lib/utils";

export type LessonCheckTableRowProps = {
  index: number;
  row: LessonTablePupilRow;
  lessonId: string;
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

export const LessonCheckTableRow = ({
  index,
  row,
  lessonId,
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
  const rowClass = cn(
    !row.homeworkChecked ? "bg-warn-soft/70" : !row.present ? "bg-paper" : "",
    hasConflict ? "ring-2 ring-inset ring-danger" : "",
  );
  const showLate = row.late && row.homeworkChecked;

  return (
    <TableRow className={rowClass}>
      <TableCell className="pl-4 tabular-nums text-muted-foreground">{index + 1}</TableCell>
      <TableCell className="sticky left-0 z-10 bg-inherit font-medium">
        <CustomLink
          href={`/lessons/${lessonId}/check?pupil=${row.pupilId}`}
          className="text-cobalt-ink hover:underline"
        >
          {row.displayName}
        </CustomLink>
      </TableCell>
      <TableCell className="text-center">
        <input
          type="checkbox"
          checked={row.present}
          disabled={readOnly || busyCells.has(`${row.pupilId}:present`)}
          aria-busy={busyCells.has(`${row.pupilId}:present`)}
          aria-label={`${messages.presentLabel}: ${row.displayName}`}
          className="size-5 accent-primary"
          onChange={(event) => onPresentChange(event.target.checked)}
        />
      </TableCell>
      {versesToRecite.map((verse) => (
        <TableCell key={verse.lessonVerseId} className="text-center">
          <ScorePad
            layout="inline"
            max={2}
            value={row.verseScores[verse.lessonVerseId] ?? null}
            notRatedLabel={messages.scoreNotRated}
            aria-label={`${fillMessage(messages.verseLabel, { position: verse.position })}: ${row.displayName}`}
            disabled={readOnly}
            aria-busy={busyCells.has(`${row.pupilId}:verse:${verse.lessonVerseId}`)}
            onValueChange={(score) => onVerseScoreChange(verse.lessonVerseId, score)}
          />
          {showLate ? <LateBadge label={messages.lateSubmitted} /> : null}
        </TableCell>
      ))}
      <TableCell className="text-center">
        {hasTest ? (
          <>
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
            {showLate ? <LateBadge label={messages.lateSubmitted} /> : null}
          </>
        ) : (
          <span className="text-xs text-muted-foreground">{messages.tableNoTest}</span>
        )}
      </TableCell>
      <TableCell className="text-center">
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
        {showLate ? <LateBadge label={messages.lateSubmitted} /> : null}
      </TableCell>
      <TableCell className="text-center">
        <input
          type="checkbox"
          checked={row.singing}
          disabled={readOnly || busyCells.has(`${row.pupilId}:singing`)}
          aria-busy={busyCells.has(`${row.pupilId}:singing`)}
          aria-label={`${messages.singingLabel}: ${row.displayName}`}
          className="size-5 accent-primary"
          onChange={(event) => onSingingChange(event.target.checked)}
        />
      </TableCell>
      <TableCell className="text-right">
        <NumberDisplay className="font-display text-base tabular-nums">
          {row.homeworkChecked && row.pointsTotal !== null ? row.pointsTotal : "—"}
        </NumberDisplay>
      </TableCell>
      <TableCell className="pr-3 text-right">
        <CustomLink
          href={`/lessons/${lessonId}/check?pupil=${row.pupilId}`}
          className="text-sm font-medium text-cobalt-ink hover:underline"
        >
          {messages.tableColumnOpen}
        </CustomLink>
      </TableCell>
    </TableRow>
  );
};
