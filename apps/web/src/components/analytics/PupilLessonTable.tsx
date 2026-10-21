import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import { CustomLink } from "@/components/ui/custom-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PupilLessonAnalyticsRow } from "@/data/analytics/get-pupil-analytics";
import { formatAnalyticsShortDate } from "@/lib/analytics/format-analytics-display";
import { fillMessage } from "@/lib/messages/fill-message";
import type { PupilAnalyticsMessages } from "@/lib/messages/analytics-messages";

type PupilLessonTableProps = {
  pupilId: string;
  lessons: PupilLessonAnalyticsRow[];
  messages: PupilAnalyticsMessages;
  locale: string;
  showCorrectActions?: boolean;
};

const formatVerses = (
  row: PupilLessonAnalyticsRow,
  empty: string,
  versesOf: string,
): string => {
  if (row.versesRecited === null || row.versesTotal === null) return empty;
  return fillMessage(versesOf, { recited: row.versesRecited, total: row.versesTotal });
};

export const PupilLessonTable = ({
  pupilId,
  lessons,
  messages,
  locale,
  showCorrectActions = false,
}: PupilLessonTableProps) => (
  <section className="mt-8 min-w-0">
    <SectionTitle as="h2" className="mb-3">{messages.lessonsTitle}</SectionTitle>
    {lessons.length === 0 ? (
      <ContentText className="text-sm text-muted">{messages.lessonsEmpty}</ContentText>
    ) : (
      <Card className="max-w-full overflow-x-auto p-0">
        <Table className="min-w-[44rem] text-left">
          <TableHeader className="border-b border-line text-sm text-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="px-5 py-3 font-normal">
                {messages.lessonColumnDate}
              </TableHead>
              <TableHead scope="col" className="px-3 py-3 font-normal">
                {messages.lessonColumnTopic}
              </TableHead>
              <TableHead scope="col" className="px-3 py-3 font-normal">
                {messages.lessonColumnPresent}
              </TableHead>
              <TableHead scope="col" className="px-3 py-3 text-right font-normal">
                {messages.lessonColumnVerses}
              </TableHead>
              <TableHead scope="col" className="px-3 py-3 text-right font-normal">
                {messages.lessonColumnTest}
              </TableHead>
              <TableHead scope="col" className="px-3 py-3 text-right font-normal">
                {messages.lessonColumnNotebook}
              </TableHead>
              {showCorrectActions ? (
                <TableHead scope="col" className="px-5 py-3 font-normal" />
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-line">
            {lessons.map((row) => (
              <TableRow key={row.lessonId} className="hover:bg-transparent">
                <TableCell className="px-5 py-3 tabular-nums">
                  {formatAnalyticsShortDate(row.lessonDate, locale)}
                </TableCell>
                <TableCell className="px-3 py-3">{row.title}</TableCell>
                <TableCell className="px-3 py-3">
                  {row.present === null
                    ? messages.presentMissing
                    : row.present
                      ? messages.presentYes
                      : messages.presentNo}
                </TableCell>
                <TableCell className="px-3 py-3 text-right tabular-nums">
                  {formatVerses(row, messages.kpiEmpty, messages.versesOf)}
                </TableCell>
                <TableCell className="px-3 py-3 text-right tabular-nums">
                  {!row.testConducted
                    ? messages.testNotConducted
                    : row.testScore === null
                      ? messages.kpiEmpty
                      : String(row.testScore)}
                  {row.submittedLate && row.testConducted ? (
                    <ContentText className="block text-sm text-muted">
                      {fillMessage(messages.submittedLate, {
                        date: formatAnalyticsShortDate(row.lessonDate, locale),
                      })}
                    </ContentText>
                  ) : null}
                </TableCell>
                <TableCell className="px-3 py-3 text-right tabular-nums">
                  {row.notebookScore === null ? messages.kpiEmpty : String(row.notebookScore)}
                  {row.submittedLate ? (
                    <ContentText className="block text-sm text-muted">
                      {fillMessage(messages.submittedLate, {
                        date: formatAnalyticsShortDate(row.lessonDate, locale),
                      })}
                    </ContentText>
                  ) : null}
                </TableCell>
                {showCorrectActions ? (
                  <TableCell className="px-5 py-2 text-right">
                    {row.homeworkChecked ? (
                      <CustomLink
                        href={`/lessons/${row.lessonId}/check?pupil=${pupilId}`}
                        className="text-sm text-cobalt-ink hover:underline"
                      >
                        {messages.lessonCorrectLabel}
                      </CustomLink>
                    ) : null}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    )}
  </section>
);
