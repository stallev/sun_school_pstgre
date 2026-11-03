import type { CSSProperties } from "react";
import { Heading } from "@/components/atoms";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LessonLeaderMark } from "@/components/teacher/LessonLeaderMark";
import { LessonSheetRow } from "@/components/teacher/LessonSheetRow";
import { SheetPrintButton } from "@/components/teacher/SheetPrintButton.client";
import type { LessonTablePageData } from "@/data/checks/load-lesson-table-page.server";
import { formatLessonCheckRowTotal } from "@/lib/check/lesson-check-row-total-display";
import { findLessonTopScorerIds } from "@/lib/check/lesson-top-scorers";
import { fillMessage } from "@/lib/messages/fill-message";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";

type LessonSheetProps = {
  data: Extract<LessonTablePageData, { kind: "page" }>;
  lessonDateLabel: string;
  messages: TeacherCheckMessages;
};

const headCell = "px-1 text-center font-normal";

/** Lesson sheet (check flow spec §7.4): read-only, compact, fits one screen at ≥ 1024 px. */
export const LessonSheet = ({ data, lessonDateLabel, messages }: LessonSheetProps) => {
  const { pupils, versesToRecite, hasTest, lessonKind, scoring } = data;
  const title = fillMessage(messages.sheetTitle, { ordinal: data.lessonOrdinal, title: data.lessonTitle });

  if (pupils.length === 0) {
    return (
      <main className="p-6">
        <Heading>{title}</Heading>
        <EmptyState title={messages.emptyRosterTitle} description={messages.emptyRosterDescription} />
      </main>
    );
  }

  const totals = pupils.map((row) => ({
    pupilId: row.pupilId,
    homeworkChecked: row.homeworkChecked,
    total: formatLessonCheckRowTotal(row, lessonKind, versesToRecite, scoring),
  }));
  const topScorerIds = findLessonTopScorerIds(totals);
  const leaders = pupils.filter((row) => topScorerIds.has(row.pupilId));
  const leaderPoints = totals.find((entry) => topScorerIds.has(entry.pupilId))?.total;
  const checked = pupils.filter((row) => row.homeworkChecked).length;
  const present = pupils.filter((row) => row.present).length;

  return (
    <main
      className="sheet-print flex min-h-dvh flex-col px-4 py-3 sm:px-6 print:min-h-0 print:p-0"
      style={{ "--sheet-rows": pupils.length + 1 } as CSSProperties}
    >
      <header className="mb-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <Heading className="text-[1.5rem] leading-tight sm:text-[1.5rem]">{title}</Heading>
          <p className="text-sm text-ink-2">
            {fillMessage(messages.sheetSummary, {
              date: lessonDateLabel,
              present,
              checked,
              total: pupils.length,
            })}
            {leaders.length > 0 ? (
              <>
                {" · "}
                <LessonLeaderMark label={messages.topScorer} />{" "}
                {fillMessage(messages.sheetLeader, {
                  names: leaders.map((row) => row.displayName).join(", "),
                  points: leaderPoints ?? 0,
                })}
              </>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <SheetPrintButton label={messages.sheetPrint} />
          <Button variant="ghost" render={<CustomLink href={`/lessons/${data.lessonId}/check`} />}>
            {messages.sheetBack}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden rounded-xl border border-line bg-card print:rounded-none print:border-0">
        <Table className="table-fixed text-sm">
          <colgroup>
            <col className="w-9" />
            <col />
            <col className="w-12" />
            {versesToRecite.map((verse) => (
              <col key={verse.lessonVerseId} className="w-12" />
            ))}
            {hasTest ? <col className="w-14" /> : null}
            <col className="w-16" />
            <col className="w-14" />
            <col className="w-16" />
          </colgroup>
          <TableHeader>
            <TableRow className="sheet-row">
              <TableHead scope="col" className="py-0 pl-3">{messages.tableColumnNumber}</TableHead>
              <TableHead scope="col" className="px-1 py-0">{messages.tableColumnPupil}</TableHead>
              <TableHead scope="col" className={headCell}>{messages.presentLabel}</TableHead>
              {versesToRecite.map((verse) => (
                <TableHead
                  key={verse.lessonVerseId}
                  scope="col"
                  className={headCell}
                  title={fillMessage(messages.verseLabel, { position: verse.position })}
                >
                  {fillMessage(messages.sheetVerseShort, { position: verse.position })}
                </TableHead>
              ))}
              {hasTest ? <TableHead scope="col" className={headCell}>{messages.testLabel}</TableHead> : null}
              <TableHead scope="col" className={headCell}>{messages.sheetNotebookShort}</TableHead>
              <TableHead scope="col" className={headCell}>{messages.sheetSingingShort}</TableHead>
              <TableHead scope="col" className="py-0 pr-3 text-right">{messages.tableGroupTotal}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pupils.map((row, index) => (
              <LessonSheetRow
                key={row.pupilId}
                index={index}
                row={row}
                lessonKind={lessonKind}
                scoring={scoring}
                hasTest={hasTest}
                versesToRecite={versesToRecite}
                isTopScorer={topScorerIds.has(row.pupilId)}
                messages={messages}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-2 text-sm text-muted-foreground print:hidden">{messages.sheetLegend}</p>
    </main>
  );
};
