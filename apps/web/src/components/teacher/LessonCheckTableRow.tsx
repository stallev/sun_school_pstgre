"use client";

import type { LessonVerseToRecite } from "@sunschool/domain";
import { PencilIcon } from "lucide-react";
import { NumberDisplay } from "@/components/atoms";
import { CustomLink } from "@/components/ui/custom-link";
import { TableCell, TableRow } from "@/components/ui/table";
import { LateBadge } from "@/components/teacher/LateBadge";
import type { LessonTablePupilRow } from "@/data/checks/load-lesson-table-page.server";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";
import { cn } from "@/lib/utils";

const scoreTone = (value: number | null): string => {
  if (value === null) return "";
  if (value >= 8) return "text-ok";
  if (value <= 4) return "text-danger";
  return "";
};

type ScoreSelectProps = {
  max: number;
  value: number | null;
  ariaLabel: string;
  disabled: boolean;
  busy: boolean;
  tone?: string;
  onChange: (value: number | null) => void;
};

export const CheckTableScoreSelect = ({
  max,
  value,
  ariaLabel,
  disabled,
  busy,
  tone,
  onChange,
}: ScoreSelectProps) => (
  <select
    aria-label={ariaLabel}
    aria-busy={busy}
    disabled={disabled || busy}
    value={value === null ? "" : String(value)}
    onChange={(event) => {
      const next = event.target.value;
      onChange(next === "" ? null : Number(next));
    }}
    className={cn(
      "h-9 min-w-14 rounded-lg border border-input bg-surface px-1 text-center text-sm tabular-nums",
      tone,
    )}
  >
    <option value="">—</option>
    {Array.from({ length: max + 1 }, (_, index) => (
      <option key={index} value={index}>{index}</option>
    ))}
  </select>
);

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
          <CheckTableScoreSelect
            max={2}
            value={row.verseScores[verse.lessonVerseId] ?? null}
            ariaLabel={`${messages.verseLabel(verse.position)}: ${row.displayName}`}
            disabled={readOnly}
            busy={busyCells.has(`${row.pupilId}:verse:${verse.lessonVerseId}`)}
            onChange={(score) => onVerseScoreChange(verse.lessonVerseId, score)}
          />
          {showLate ? <LateBadge label={messages.lateSubmitted} /> : null}
        </TableCell>
      ))}
      <TableCell className="text-center">
        {hasTest ? (
          <>
            <CheckTableScoreSelect
              max={10}
              value={row.testScore}
              ariaLabel={`${messages.testLabel}: ${row.displayName}`}
              disabled={readOnly}
              busy={busyCells.has(`${row.pupilId}:test`)}
              tone={scoreTone(row.testScore)}
              onChange={onTestScoreChange}
            />
            {showLate ? <LateBadge label={messages.lateSubmitted} /> : null}
          </>
        ) : (
          <span className="text-xs text-muted-foreground">{messages.tableNoTest}</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <CheckTableScoreSelect
          max={10}
          value={row.notebookScore}
          ariaLabel={`${messages.notebookLabel}: ${row.displayName}`}
          disabled={readOnly}
          busy={busyCells.has(`${row.pupilId}:notebook`)}
          tone={scoreTone(row.notebookScore)}
          onChange={onNotebookScoreChange}
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
          aria-label={messages.tableOpenPupilAria(row.displayName)}
          className="inline-flex size-8 items-center justify-center rounded-md text-cobalt-ink hover:bg-paper"
        >
          <PencilIcon className="size-4" aria-hidden />
          <span className="sr-only">{messages.tableColumnOpen}</span>
        </CustomLink>
      </TableCell>
    </TableRow>
  );
};
