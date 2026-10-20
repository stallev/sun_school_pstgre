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
import type { ConductedLessonsSnapshot } from "@/data/analytics/get-conducted-lessons";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type ConductedLessonsTableProps = {
  snapshot: ConductedLessonsSnapshot;
  messages: AnalyticsMessages;
};

export const ConductedLessonsTable = ({ snapshot, messages }: ConductedLessonsTableProps) => (
  <section className="space-y-2">
    <SectionTitle as="h2" className="text-lg">{messages.conducted.title}</SectionTitle>
    <ContentText className="text-sm text-muted-foreground">{messages.conducted.subtitle}</ContentText>
    {snapshot.teachers.length === 0 ? (
      <ContentText className="text-sm text-muted-foreground">{messages.conducted.empty}</ContentText>
    ) : (
      <Card className="overflow-x-auto p-0">
        <Table className="text-base">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{messages.conducted.columnTeacher}</TableHead>
              <TableHead scope="col">{messages.conducted.columnConducted}</TableHead>
              <TableHead scope="col">{messages.conducted.columnRegular}</TableHead>
              <TableHead scope="col">{messages.conducted.columnReview}</TableHead>
              <TableHead scope="col">{messages.conducted.columnPlanned}</TableHead>
              <TableHead scope="col">{messages.conducted.columnLessons}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshot.teachers.map((row) => (
              <TableRow key={row.teacherId}>
                <TableCell>
                  {row.displayName}
                  {row.noLongerAssigned ? (
                    <ContentText className="text-sm text-muted-foreground">
                      {messages.conducted.noLongerAssigned}
                    </ContentText>
                  ) : null}
                </TableCell>
                <TableCell>{row.conductedCount}</TableCell>
                <TableCell>{row.regularCount}</TableCell>
                <TableCell>{row.reviewCount}</TableCell>
                <TableCell>{row.plannedCount}</TableCell>
                <TableCell>{row.lessonOrdinals.join(", ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    )}
  </section>
);
