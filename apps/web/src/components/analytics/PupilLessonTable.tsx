import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PupilLessonAnalyticsRow } from "@/data/analytics/get-pupil-analytics";
import type { PupilAnalyticsMessages } from "@/lib/messages/analytics-messages";

type PupilLessonTableProps = {
  lessons: PupilLessonAnalyticsRow[];
  messages: PupilAnalyticsMessages;
  formatDate: (iso: string) => string;
  formatLateDate: (iso: string) => string;
};

const formatVerses = (
  row: PupilLessonAnalyticsRow,
  empty: string,
  versesOf: (recited: number, total: number) => string,
): string => {
  if (row.versesRecited === null || row.versesTotal === null) return empty;
  return versesOf(row.versesRecited, row.versesTotal);
};

export const PupilLessonTable = ({
  lessons,
  messages,
  formatDate,
  formatLateDate,
}: PupilLessonTableProps) => (
  <section className="space-y-2">
    <SectionTitle as="h2" className="text-lg">{messages.lessonsTitle}</SectionTitle>
    {lessons.length === 0 ? (
      <ContentText className="text-sm text-muted-foreground">{messages.lessonsEmpty}</ContentText>
    ) : (
      <Card className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{messages.lessonColumnDate}</TableHead>
              <TableHead scope="col">{messages.lessonColumnTopic}</TableHead>
              <TableHead scope="col">{messages.lessonColumnPresent}</TableHead>
              <TableHead scope="col" className="text-right">{messages.lessonColumnVerses}</TableHead>
              <TableHead scope="col" className="text-right">{messages.lessonColumnTest}</TableHead>
              <TableHead scope="col" className="text-right">{messages.lessonColumnNotebook}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.map((row) => (
              <TableRow key={row.lessonId}>
                <TableCell className="tabular-nums">{formatDate(row.lessonDate)}</TableCell>
                <TableCell>{row.title}</TableCell>
                <TableCell>
                  {row.present === null
                    ? messages.presentMissing
                    : row.present
                      ? messages.presentYes
                      : messages.presentNo}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatVerses(row, messages.kpiEmpty, messages.versesOf)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {!row.testConducted
                    ? messages.testNotConducted
                    : row.testScore === null
                      ? messages.kpiEmpty
                      : String(row.testScore)}
                  {row.submittedLate && row.testConducted ? (
                    <ContentText className="block text-xs text-muted-foreground">
                      {messages.submittedLate(formatLateDate(row.lessonDate))}
                    </ContentText>
                  ) : null}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.notebookScore === null ? messages.kpiEmpty : String(row.notebookScore)}
                  {row.submittedLate ? (
                    <ContentText className="block text-xs text-muted-foreground">
                      {messages.submittedLate(formatLateDate(row.lessonDate))}
                    </ContentText>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    )}
  </section>
);
