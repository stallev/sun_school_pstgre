import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import { CustomLink } from "@/components/ui/custom-link";
import {
  Table,
  TableBody,
  TableCaption,
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
    return <ContentText className="text-sm text-muted">{messages.empty}</ContentText>;
  }

  return (
    <Card className="overflow-x-auto p-0">
      <Table className="min-w-[34rem] text-base">
        <TableCaption className="sr-only">{messages.tableCaption}</TableCaption>
        <TableHeader className="border-line text-sm text-muted">
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="w-14 px-5 py-3 font-normal">
              {messages.columnPlace}
            </TableHead>
            <TableHead scope="col" className="px-3 py-3 font-normal">
              {messages.columnPupil}
            </TableHead>
            <TableHead scope="col" className="px-3 py-3 text-right font-normal">
              {messages.columnMetric}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-line">
          {rows.map((row) => (
            <TableRow key={row.pupilId} className="hover:bg-transparent">
              <TableCell className="px-5 py-3">
                <NumberDisplay
                  className={row.place <= 3 ? "text-lg tabular-nums" : "text-muted tabular-nums"}
                >
                  {row.place}
                </NumberDisplay>
              </TableCell>
              <TableCell className="px-3 py-3">
                <CustomLink
                  href={`/analytics/pupils/${row.pupilId}`}
                  className="font-medium hover:text-cobalt-ink"
                >
                  {row.displayName}
                </CustomLink>
              </TableCell>
              <TableCell className="px-3 py-3 text-right tabular-nums">{row.metric}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
