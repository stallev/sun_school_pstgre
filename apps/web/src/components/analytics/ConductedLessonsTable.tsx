import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ConductedLessonsSnapshot } from "@/data/analytics/get-conducted-lessons";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type ConductedLessonsTableProps = {
  snapshot: ConductedLessonsSnapshot;
  messages: AnalyticsMessages;
};

export const ConductedLessonsTable = ({ snapshot, messages }: ConductedLessonsTableProps) => (
  <section className="min-w-0">
    <SectionTitle as="h2" className="mt-8 mb-1 text-[1.25rem] font-medium leading-snug">
      {messages.conducted.title}
    </SectionTitle>
    <ContentText className="mb-3 text-sm text-ink-2">{messages.conducted.subtitle}</ContentText>
    {snapshot.teachers.length === 0 ? (
      <ContentText className="text-sm text-muted">{messages.conducted.empty}</ContentText>
    ) : (
      <Card className="max-w-full overflow-x-auto p-0">
        <Table className="min-w-[40rem] text-base">
          <TableCaption className="sr-only">{messages.conducted.tableCaption}</TableCaption>
          <TableHeader className="border-b border-line text-sm text-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="px-5 py-3 font-normal">
                {messages.conducted.columnTeacher}
              </TableHead>
              <TableHead scope="col" className="px-3 py-3 text-right font-normal">
                {messages.conducted.columnConducted}
              </TableHead>
              <TableHead scope="col" className="px-3 py-3 text-right font-normal">
                {messages.conducted.columnRegular}
              </TableHead>
              <TableHead scope="col" className="px-3 py-3 text-right font-normal">
                {messages.conducted.columnReview}
              </TableHead>
              <TableHead scope="col" className="px-3 py-3 text-right font-normal">
                {messages.conducted.columnPlanned}
              </TableHead>
              <TableHead scope="col" className="px-5 py-3 font-normal">
                {messages.conducted.columnLessons}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-line">
            {snapshot.teachers.map((row) => (
              <TableRow key={row.teacherId} className="hover:bg-transparent">
                <TableCell className="px-5 py-3 font-medium">
                  {row.displayName}
                  {row.noLongerAssigned ? (
                    <ContentText className="text-xs font-normal text-muted">
                      {messages.conducted.noLongerAssigned}
                    </ContentText>
                  ) : null}
                </TableCell>
                <TableCell className="px-3 py-3 text-right tabular-nums">{row.conductedCount}</TableCell>
                <TableCell className="px-3 py-3 text-right tabular-nums">{row.regularCount}</TableCell>
                <TableCell className="px-3 py-3 text-right tabular-nums">{row.reviewCount}</TableCell>
                <TableCell className="px-3 py-3 text-right tabular-nums">{row.plannedCount}</TableCell>
                <TableCell className="px-5 py-3 text-sm text-ink-2">{row.lessonOrdinals.join(", ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    )}
  </section>
);
