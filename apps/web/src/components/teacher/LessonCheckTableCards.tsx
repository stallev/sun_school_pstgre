"use client";

import type { LessonVerseToRecite } from "@sunschool/domain";
import { NumberDisplay } from "@/components/atoms";
import { ScoreCell } from "@/components/ui/score-cell";
import { ScorePad } from "@/components/ui/score-pad";
import { CustomLink } from "@/components/ui/custom-link";
import type { LessonTablePupilRow } from "@/data/checks/load-lesson-table-page.server";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";
import { fillMessage } from "@/lib/messages/fill-message";
import { cn } from "@/lib/utils";

type LessonCheckTableCardsProps = {
  rows: readonly LessonTablePupilRow[];
  lessonId: string;
  hasTest: boolean;
  versesToRecite: readonly LessonVerseToRecite[];
  readOnly: boolean;
  busyCells: ReadonlySet<string>;
  conflictIds: ReadonlySet<string>;
  pending: boolean;
  messages: TeacherCheckMessages;
  openCellKey: string | null;
  onOpenCellKeyChange: (key: string | null) => void;
  onPresentChange: (pupilId: string, present: boolean) => void;
  onSingingChange: (pupilId: string, singing: boolean) => void;
  onTestScoreChange: (pupilId: string, score: number | null) => void;
  onNotebookScoreChange: (pupilId: string, score: number | null) => void;
  onVerseScoreChange: (pupilId: string, lessonVerseId: string, score: number | null) => void;
};

const toggleClass = (pressed: boolean) =>
  cn(
    "inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-[color,background-color,border-color] duration-100 ease-out-soft",
    pressed
      ? "border-cobalt-ink bg-cobalt-soft text-cobalt-ink"
      : "border-input bg-surface text-ink hover:bg-paper",
  );

export const LessonCheckTableCards = ({
  rows,
  lessonId,
  hasTest,
  versesToRecite,
  readOnly,
  busyCells,
  conflictIds,
  pending,
  messages,
  openCellKey,
  onOpenCellKeyChange,
  onPresentChange,
  onSingingChange,
  onTestScoreChange,
  onNotebookScoreChange,
  onVerseScoreChange,
}: LessonCheckTableCardsProps) => (
  <ul className="space-y-2" aria-busy={pending}>
    {rows.map((row, index) => {
      const hasConflict = conflictIds.has(row.pupilId);
      return (
        <li
          key={row.pupilId}
          className={cn(
            "rounded-xl border border-line bg-card p-3",
            !row.homeworkChecked ? "bg-warn-soft/70" : !row.present ? "bg-paper" : "",
            hasConflict ? "ring-2 ring-danger" : "",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="w-6 text-sm tabular-nums text-muted-foreground">{index + 1}</span>
            <CustomLink
              href={`/lessons/${lessonId}/check?pupil=${row.pupilId}`}
              className="min-w-0 flex-1 truncate font-medium text-cobalt-ink"
            >
              {row.displayName}
            </CustomLink>
            <NumberDisplay className="font-display text-lg tabular-nums">
              {row.homeworkChecked && row.pointsTotal !== null ? row.pointsTotal : "—"}
            </NumberDisplay>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              aria-pressed={row.present}
              aria-busy={busyCells.has(`${row.pupilId}:present`) || undefined}
              disabled={readOnly || busyCells.has(`${row.pupilId}:present`)}
              aria-label={`${messages.presentLabel}: ${row.displayName}`}
              className={toggleClass(row.present)}
              onClick={() => onPresentChange(row.pupilId, !row.present)}
            >
              {messages.presentLabel}
            </button>
            <button
              type="button"
              aria-pressed={row.singing}
              aria-busy={busyCells.has(`${row.pupilId}:singing`) || undefined}
              disabled={readOnly || busyCells.has(`${row.pupilId}:singing`)}
              aria-label={`${messages.singingLabel}: ${row.displayName}`}
              className={toggleClass(row.singing)}
              onClick={() => onSingingChange(row.pupilId, !row.singing)}
            >
              {messages.singingLabel}
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {versesToRecite.map((verse) => (
              <div key={verse.lessonVerseId} className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {fillMessage(messages.verseLabel, { position: verse.position })}
                </p>
                <ScorePad
                  layout="inline"
                  max={2}
                  value={row.verseScores[verse.lessonVerseId] ?? null}
                  notRatedLabel={messages.scoreNotRated}
                  aria-label={`${fillMessage(messages.verseLabel, { position: verse.position })}: ${row.displayName}`}
                  disabled={readOnly}
                  aria-busy={busyCells.has(`${row.pupilId}:verse:${verse.lessonVerseId}`)}
                  onValueChange={(score) => onVerseScoreChange(row.pupilId, verse.lessonVerseId, score)}
                />
              </div>
            ))}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{messages.testLabel}</p>
              {hasTest ? (
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
                  onValueChange={(score) => onTestScoreChange(row.pupilId, score)}
                />
              ) : (
                <span className="text-sm text-muted-foreground">{messages.tableNoTest}</span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{messages.notebookLabel}</p>
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
                onValueChange={(score) => onNotebookScoreChange(row.pupilId, score)}
              />
            </div>
          </div>
          {row.late && row.homeworkChecked ? (
            <p className="mt-2 text-sm text-warn">{messages.lateSubmitted}</p>
          ) : null}
          {hasConflict ? (
            <p className="mt-2 text-sm text-danger">{messages.conflictTitle}</p>
          ) : null}
        </li>
      );
    })}
  </ul>
);
