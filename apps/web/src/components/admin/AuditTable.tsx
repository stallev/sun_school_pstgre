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
          <TableHead scope="col" className="px-5 py-3 font-normal text-muted">
            {columnOccurred}
          </TableHead>
          <TableHead scope="col" className="px-5 py-3 font-normal text-muted">
            {columnActor}
          </TableHead>
          <TableHead scope="col" className="px-5 py-3 font-normal text-muted">
            {columnAction}
          </TableHead>
          <TableHead scope="col" className="px-5 py-3 font-normal text-muted">
            {columnEntity}
          </TableHead>
          <TableHead scope="col" className="px-5 py-3 font-normal text-muted">
            {columnDetails}
          </TableHead>
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
