import { ContentText } from "@/components/atoms/ContentText";
import { StatusText } from "@/components/ui/status-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BrickLedgerEntryDto } from "@/data/bricks/bricks-shared.server";
import type { TeacherBricksMessages } from "@/lib/messages/teacher-bricks-messages";
import { cn } from "@/lib/utils";

type LedgerListProps = {
  entries: readonly BrickLedgerEntryDto[];
  messages: TeacherBricksMessages;
};

export const LedgerList = ({ entries, messages }: LedgerListProps) => {
  if (entries.length === 0) {
    return <ContentText className="text-muted-foreground">{messages.ledgerEmpty}</ContentText>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">{messages.ledgerColumnDate}</TableHead>
            <TableHead scope="col">{messages.ledgerColumnQty}</TableHead>
            <TableHead scope="col" className="hidden md:table-cell">{messages.ledgerColumnBy}</TableHead>
            <TableHead scope="col">{messages.ledgerColumnNote}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.issuedOn}</TableCell>
              <TableCell>
                <span className={cn(entry.quantity < 0 && "text-danger")}>{entry.quantity}</span>
                {entry.quantity < 0 ? (
                  <StatusText tone="warn" className="ml-2 text-xs">
                    {messages.ledgerCompensation}
                  </StatusText>
                ) : null}
              </TableCell>
              <TableCell className="hidden md:table-cell">{entry.issuedByName}</TableCell>
              <TableCell>{entry.note ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
