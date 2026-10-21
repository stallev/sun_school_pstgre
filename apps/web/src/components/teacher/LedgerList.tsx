import { RecordCard } from "@/components/patterns/RecordCard";
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
    <>
      <ul className="space-y-3 lg:hidden">
        {entries.map((entry) => (
          <RecordCard
            key={entry.id}
            title={<span className="tabular-nums">{entry.issuedOn}</span>}
            fields={[
              {
                label: messages.ledgerColumnQty,
                value: (
                  <span className={cn(entry.quantity < 0 && "text-danger")}>
                    {entry.quantity}
                    {entry.quantity < 0 ? (
                      <StatusText tone="warn" className="ml-2 text-xs">
                        {messages.ledgerCompensation}
                      </StatusText>
                    ) : null}
                  </span>
                ),
              },
              { label: messages.ledgerColumnBy, value: entry.issuedByName },
              { label: messages.ledgerColumnNote, value: entry.note ?? "—", wide: true },
            ]}
          />
        ))}
      </ul>
      <div className="hidden overflow-hidden rounded-xl border border-line bg-surface lg:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">{messages.ledgerColumnDate}</TableHead>
            <TableHead scope="col">{messages.ledgerColumnQty}</TableHead>
            <TableHead scope="col">{messages.ledgerColumnBy}</TableHead>
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
              <TableCell>{entry.issuedByName}</TableCell>
              <TableCell>{entry.note ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </>
  );
};
