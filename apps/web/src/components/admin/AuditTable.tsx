import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditEntryRow } from "@/components/admin/AuditEntryRow";
import type { AuditLogEntryDto } from "@/data/audit/audit-shared.server";

type AuditTableProps = {
  entries: AuditLogEntryDto[];
  formatOccurred: (iso: string) => string;
  formatAction: (action: string) => string;
  columnOccurred: string;
  columnActor: string;
  columnAction: string;
  columnEntity: string;
  columnDetails: string;
};

export const AuditTable = ({
  entries,
  formatOccurred,
  formatAction,
  columnOccurred,
  columnActor,
  columnAction,
  columnEntity,
  columnDetails,
}: AuditTableProps) => (
  <div className="overflow-x-auto rounded-xl border border-line bg-surface">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{columnOccurred}</TableHead>
          <TableHead>{columnActor}</TableHead>
          <TableHead>{columnAction}</TableHead>
          <TableHead>{columnEntity}</TableHead>
          <TableHead>{columnDetails}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <AuditEntryRow
            key={entry.id}
            entry={entry}
            occurredLabel={formatOccurred(entry.occurredAtIso)}
            actionLabel={formatAction(entry.action)}
          />
        ))}
      </TableBody>
    </Table>
  </div>
);
