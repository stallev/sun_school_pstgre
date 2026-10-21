"use client";

import { CheckIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { LessonCheckTableCards } from "@/components/teacher/LessonCheckTableCards";
import { LessonCheckTableRow } from "@/components/teacher/LessonCheckTableRow";
import { useLessonCheckTable } from "@/components/teacher/use-lesson-check-table";
import type { LessonTablePageData } from "@/data/checks/load-lesson-table-page.server";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";
import { fillMessage } from "@/lib/messages/fill-message";
import { useMdUp } from "@/lib/ui/use-md-up";
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

  const mdUp = useMdUp();
  const [openCellKey, setOpenCellKey] = useState<string | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [stickyTableHead, setStickyTableHead] = useState(true);

  useEffect(() => {
    if (!mdUp) return;
    const node = tableScrollRef.current;
    if (!node) return;
    const sync = () => setStickyTableHead(node.scrollWidth <= node.clientWidth);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, [mdUp, data.pupils.length, data.versesToRecite.length]);

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

      <div
        className="sticky top-0 z-20 -mx-1 space-y-2 bg-background px-1 pb-2 pt-1"
        aria-busy={table.pending}
      >
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
      </div>

      {mdUp ? (
        <Card>
          <div ref={tableScrollRef} className="overflow-x-auto">
            <Table>
              <TableHeader
                className={cn(stickyTableHead && "[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-[1] [&_tr]:bg-card")}
              >
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
                  <TableHead scope="col" className="w-16 pr-3 text-right">{messages.tableColumnOpen}</TableHead>
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
                    openCellKey={openCellKey}
                    onOpenCellKeyChange={setOpenCellKey}
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
          </div>
        </Card>
      ) : (
        <LessonCheckTableCards
          rows={table.rows}
          lessonId={data.lessonId}
          hasTest={data.hasTest}
          versesToRecite={data.versesToRecite}
          readOnly={table.readOnly}
          busyCells={table.busyCells}
          conflictIds={table.conflictIds}
          pending={table.pending}
          messages={messages}
          openCellKey={openCellKey}
          onOpenCellKeyChange={setOpenCellKey}
          onPresentChange={table.mutatePresent}
          onSingingChange={table.mutateSinging}
          onTestScoreChange={table.mutateTestScore}
          onNotebookScoreChange={table.mutateNotebookScore}
          onVerseScoreChange={table.mutateVerseScore}
        />
      )}

      <p className="text-sm text-muted-foreground">{messages.tableFootnote}</p>
    </div>
  );
};
