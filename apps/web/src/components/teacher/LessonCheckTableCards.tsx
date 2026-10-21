"use client";

import type { LessonVerseToRecite } from "@sunschool/domain";
import { NumberDisplay } from "@/components/atoms";
import { ContentText } from "@/components/atoms";
import { ScoreCell } from "@/components/ui/score-cell";
import { StatusText } from "@/components/ui/status-text";
import { CustomLink } from "@/components/ui/custom-link";
import { LateBadge } from "@/components/teacher/LateBadge";
import { LessonCheckPressToggle } from "@/components/teacher/LessonCheckPressToggle";
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
      const statusLabel = !row.homeworkChecked
        ? messages.tableLegendUnchecked
        : !row.present
          ? messages.tableLegendAbsent
          : null;
      return (
        <li
          key={row.pupilId}
          className={cn(
            "rounded-xl border border-line bg-card p-3",
            hasConflict && "ring-2 ring-danger",
          )}
        >
          <div className="flex items-start gap-2">
            <span className="w-6 pt-0.5 text-sm tabular-nums text-muted-foreground">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <CustomLink
                href={`/lessons/${lessonId}/check?pupil=${row.pupilId}`}
                className="block truncate font-medium text-cobalt-ink"
              >
                {row.displayName}
              </CustomLink>
              <span className="mt-0.5 flex flex-wrap items-center gap-2">
                {statusLabel ? (
                  <StatusText tone={!row.homeworkChecked ? "warn" : "neutral"}>{statusLabel}</StatusText>
                ) : null}
                {row.late ? <LateBadge label={messages.lateSubmitted} /> : null}
              </span>
            </div>
            <NumberDisplay className="font-display text-lg tabular-nums">
              {row.homeworkChecked && row.pointsTotal !== null ? row.pointsTotal : "—"}
            </NumberDisplay>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="flex flex-1 items-center gap-2">
              <ContentText tone="secondary" className="text-sm">{messages.presentLabel}</ContentText>
              <LessonCheckPressToggle
                pressed={row.present}
                label={`${messages.presentLabel}: ${row.displayName}`}
                disabled={readOnly}
                busy={busyCells.has(`${row.pupilId}:present`)}
                onPressedChange={(present) => onPresentChange(row.pupilId, present)}
              />
            </div>
            <div className="flex flex-1 items-center gap-2">
              <ContentText tone="secondary" className="text-sm">{messages.singingLabel}</ContentText>
              <LessonCheckPressToggle
                pressed={row.singing}
                label={`${messages.singingLabel}: ${row.displayName}`}
                disabled={readOnly}
                busy={busyCells.has(`${row.pupilId}:singing`)}
                onPressedChange={(singing) => onSingingChange(row.pupilId, singing)}
              />
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {versesToRecite.map((verse) => (
              <div key={verse.lessonVerseId} className="space-y-1">
                <ContentText tone="secondary" className="text-sm">
                  {fillMessage(messages.verseLabel, { position: verse.position })}
                  {" · "}
                  {messages.tableScaleVerse}
                </ContentText>
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
                  onValueChange={(score) => onVerseScoreChange(row.pupilId, verse.lessonVerseId, score)}
                />
              </div>
            ))}
            {hasTest ? (
              <div className="space-y-1">
                <ContentText tone="secondary" className="text-sm">
                  {messages.testLabel} · {messages.tableScaleTen}
                </ContentText>
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
              </div>
            ) : null}
            <div className="space-y-1">
              <ContentText tone="secondary" className="text-sm">
                {messages.notebookLabel} · {messages.tableScaleTen}
              </ContentText>
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
          {hasConflict ? (
            <p className="mt-2 text-sm text-danger">{messages.conflictTitle}</p>
          ) : null}
        </li>
      );
    })}
  </ul>
);
