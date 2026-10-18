import { NumberDisplay } from "@/components/atoms/NumberDisplay";
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
import type { RatingTableRow } from "@/data/analytics/get-group-rating";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type RatingTableProps = {
  rows: RatingTableRow[];
  messages: AnalyticsMessages["rating"];
};

export const RatingTable = ({ rows, messages }: RatingTableProps) => {
  if (rows.length === 0) {
    return <ContentText className="text-sm text-muted-foreground">{messages.empty}</ContentText>;
  }

  return (
    <Card className="overflow-x-auto p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-14">{messages.columnPlace}</TableHead>
            <TableHead scope="col">{messages.columnPupil}</TableHead>
            <TableHead scope="col" className="text-right">{messages.columnMetric}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.pupilId}>
              <TableCell>
                <NumberDisplay className={row.place <= 3 ? "text-lg" : "text-muted-foreground"}>
                  {row.place}
                </NumberDisplay>
              </TableCell>
              <TableCell>
                <CustomLink href={`/analytics/pupils/${row.pupilId}`} className="font-medium">
                  {row.displayName}
                </CustomLink>
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.metric}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
