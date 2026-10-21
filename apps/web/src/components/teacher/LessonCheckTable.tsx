"use client";

import { CheckIcon, PencilIcon } from "lucide-react";
import { Banner } from "@/components/patterns/Banner";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomLink } from "@/components/ui/custom-link";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckTableScoreSelect,
  LessonCheckTableRow,
} from "@/components/teacher/LessonCheckTableRow";
import { useLessonCheckTable } from "@/components/teacher/use-lesson-check-table";
import type { LessonTablePageData } from "@/data/checks/load-lesson-table-page.server";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";
import { fillMessage } from "@/lib/messages/fill-message";
import { cn } from "@/lib/utils";

type LessonCheckTableProps = {
  data: Extract<LessonTablePageData, { kind: "page" }>;
  messages: TeacherCheckMessages;
  dictionaries: Record<string, Dictionary>;
};

export const LessonCheckTable = ({ data, messages, dictionaries }: LessonCheckTableProps) => {
  const table = useLessonCheckTable({
    lessonId: data.lessonId,
    lessonKind: data.lessonKind,
    lessonStatus: data.lessonStatus,
    canMutate: data.canMutate,
    yearClosed: data.yearClosed,
    isAdmin: data.isAdmin,
    versesToRecite: data.versesToRecite,
    scoring: data.scoring,
    initialPupils: data.pupils,
    messages,
    dictionaries,
  });

  if (data.pupils.length === 0) {
    return (
      <EmptyState
        title={messages.emptyRosterTitle}
        description={messages.emptyRosterDescription}
        action={
          <Button render={<CustomLink href="/group" />}>{messages.emptyRosterAction}</Button>
        }
      />
    );
  }

  const subtitle = `${fillMessage(messages.lessonSubtitle, {
    ordinal: data.lessonOrdinal,
    title: data.lessonTitle,
  })} · ${data.lessonDateIso}`;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <CustomLink href={`/lessons/${data.lessonId}`} className="text-sm text-cobalt-ink">
          {messages.linkLesson}
        </CustomLink>
      </header>
      <PageHeader
        title={messages.tablePageTitle}
        description={`${subtitle} · ${fillMessage(messages.tableProgressHeader, {
          checked: data.checkedCount,
          total: data.pupils.length,
        })}`}
        actions={
          <Button render={<CustomLink href={`/lessons/${data.lessonId}/check`} />}>
            <CheckIcon className="size-4" aria-hidden />
            {messages.tableLinkSequential}
          </Button>
        }
      />

      {data.yearClosed && !data.isAdmin ? (
        <Banner tone="warning" title={messages.yearClosedTitle}>
          <p>{messages.yearClosedDescription}</p>
        </Banner>
      ) : null}

      {table.lessonCorrection ? (
        <Banner tone="warning" title={messages.correctionBanner} />
      ) : null}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={table.filterPresent}
            onChange={(event) => table.setFilterPresent(event.target.checked)}
            className="size-4 accent-primary"
          />
          {messages.tableFilterPresent}
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={table.filterUnchecked}
            onChange={(event) => table.setFilterUnchecked(event.target.checked)}
            className="size-4 accent-primary"
          />
          {messages.tableFilterUnchecked}
        </label>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground sm:ml-auto">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-warn-soft ring-1 ring-line" />
            {messages.tableLegendUnchecked}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-paper ring-1 ring-line" />
            {messages.tableLegendAbsent}
          </span>
        </span>
      </div>

      <Card className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="w-12 pl-4">{messages.tableColumnNumber}</TableHead>
              <TableHead scope="col" className="sticky left-0 z-10 bg-card">{messages.tableColumnPupil}</TableHead>
              <TableHead scope="col" className="text-center">{messages.presentLabel}</TableHead>
              {data.versesToRecite.map((verse) => (
                <TableHead key={verse.lessonVerseId} scope="col" className="text-center">
                  {fillMessage(messages.verseLabel, { position: verse.position })}
                </TableHead>
              ))}
              <TableHead scope="col" className="text-center">{messages.testLabel}</TableHead>
              <TableHead scope="col" className="text-center">{messages.notebookLabel}</TableHead>
              <TableHead scope="col" className="text-center">{messages.singingLabel}</TableHead>
              <TableHead scope="col" className="text-right">{messages.pointsLabel}</TableHead>
              <TableHead scope="col" className="w-10 pr-3">
                <span className="sr-only">{messages.tableColumnOpen}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map((row, index) => (
              <LessonCheckTableRow
                key={row.pupilId}
                index={index}
                row={row}
                lessonId={data.lessonId}
                hasTest={data.hasTest}
                versesToRecite={data.versesToRecite}
                readOnly={table.readOnly}
                busyCells={table.busyCells}
                hasConflict={table.conflictIds.has(row.pupilId)}
                messages={messages}
                onPresentChange={(present) => table.mutatePresent(row.pupilId, present)}
                onSingingChange={(singing) => table.mutateSinging(row.pupilId, singing)}
                onTestScoreChange={(score) => table.mutateTestScore(row.pupilId, score)}
                onNotebookScoreChange={(score) => table.mutateNotebookScore(row.pupilId, score)}
                onVerseScoreChange={(lessonVerseId, score) =>
                  table.mutateVerseScore(row.pupilId, lessonVerseId, score)
                }
              />
            ))}
          </TableBody>
        </Table>
      </Card>

      <ul className="space-y-2 md:hidden" aria-busy={table.pending}>
        {table.rows.map((row, index) => (
          <li
            key={row.pupilId}
            className={cn(
              "rounded-xl border border-line bg-card p-3",
              !row.homeworkChecked ? "bg-warn-soft/70" : !row.present ? "bg-paper" : "",
              table.conflictIds.has(row.pupilId) ? "ring-2 ring-danger" : "",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="w-6 text-sm tabular-nums text-muted-foreground">{index + 1}</span>
              <CustomLink
                href={`/lessons/${data.lessonId}/check?pupil=${row.pupilId}`}
                className="min-w-0 flex-1 truncate font-medium text-cobalt-ink"
              >
                {row.displayName}
              </CustomLink>
              <span className="font-display text-lg tabular-nums">
                {row.homeworkChecked && row.pointsTotal !== null ? row.pointsTotal : "—"}
              </span>
              <CustomLink
                href={`/lessons/${data.lessonId}/check?pupil=${row.pupilId}`}
                aria-label={fillMessage(messages.tableOpenPupilAria, { name: row.displayName })}
                className="inline-flex size-8 items-center justify-center rounded-md text-cobalt-ink"
              >
                <PencilIcon className="size-4" aria-hidden />
              </CustomLink>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.present}
                  disabled={table.readOnly || table.busyCells.has(`${row.pupilId}:present`)}
                  aria-busy={table.busyCells.has(`${row.pupilId}:present`)}
                  aria-label={`${messages.presentLabel}: ${row.displayName}`}
                  className="size-5 accent-primary"
                  onChange={(event) => table.mutatePresent(row.pupilId, event.target.checked)}
                />
                <span>{messages.presentLabel}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.singing}
                  disabled={table.readOnly || table.busyCells.has(`${row.pupilId}:singing`)}
                  aria-busy={table.busyCells.has(`${row.pupilId}:singing`)}
                  aria-label={`${messages.singingLabel}: ${row.displayName}`}
                  className="size-5 accent-primary"
                  onChange={(event) => table.mutateSinging(row.pupilId, event.target.checked)}
                />
                <span>{messages.singingLabel}</span>
              </label>
              {data.versesToRecite.length > 0 ? (
                <div className="col-span-2 flex flex-wrap items-center gap-1.5">
                  <span className="w-14 text-muted-foreground">{messages.tableVersesMobile}</span>
                  {data.versesToRecite.map((verse) => (
                    <CheckTableScoreSelect
                      key={verse.lessonVerseId}
                      max={2}
                      value={row.verseScores[verse.lessonVerseId] ?? null}
                      ariaLabel={`${fillMessage(messages.verseLabel, { position: verse.position })}: ${row.displayName}`}
                      disabled={table.readOnly}
                      busy={table.busyCells.has(`${row.pupilId}:verse:${verse.lessonVerseId}`)}
                      onChange={(score) => table.mutateVerseScore(row.pupilId, verse.lessonVerseId, score)}
                    />
                  ))}
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <span className="w-14 text-muted-foreground">{messages.testLabel}</span>
                {data.hasTest ? (
                  <CheckTableScoreSelect
                    max={10}
                    value={row.testScore}
                    ariaLabel={`${messages.testLabel}: ${row.displayName}`}
                    disabled={table.readOnly}
                    busy={table.busyCells.has(`${row.pupilId}:test`)}
                    onChange={(score) => table.mutateTestScore(row.pupilId, score)}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">{messages.tableNoTest}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{messages.notebookLabel}</span>
                <CheckTableScoreSelect
                  max={10}
                  value={row.notebookScore}
                  ariaLabel={`${messages.notebookLabel}: ${row.displayName}`}
                  disabled={table.readOnly}
                  busy={table.busyCells.has(`${row.pupilId}:notebook`)}
                  onChange={(score) => table.mutateNotebookScore(row.pupilId, score)}
                />
              </div>
            </div>
            {row.late && row.homeworkChecked ? (
              <p className="mt-1 text-sm text-warn">{messages.lateSubmitted}</p>
            ) : null}
            {table.conflictIds.has(row.pupilId) ? (
              <p className="mt-1 text-sm text-danger">{messages.conflictTitle}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-sm text-muted-foreground">{messages.tableFootnote}</p>
    </div>
  );
};
