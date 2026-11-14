import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditEntryRow } from "@/components/admin/AuditEntryRow";
import { AuditEntryCard } from "@/components/admin/AuditEntryCard";
import type { AuditLogEntryDto } from "@/data/audit/audit-shared.server";

type AuditTableProps = {
  entries: AuditLogEntryDto[];
  formatOccurred: (iso: string) => string;
  columnOccurred: string;
  columnActor: string;
  columnAction: string;
  columnEntity: string;
  columnDetails: string;
  technicalRecordTerm: string;
  technicalRecordHint: string;
  technicalRecordHintAria: string;
  reasonPrefix: string;
};

export const AuditTable = ({
  entries,
  formatOccurred,
  columnOccurred,
  columnActor,
  columnAction,
  columnEntity,
  columnDetails,
  technicalRecordTerm,
  technicalRecordHint,
  technicalRecordHintAria,
  reasonPrefix,
}: AuditTableProps) => (
  <>
    <ul className="space-y-stack lg:hidden">
      {entries.map((entry) => (
        <AuditEntryCard
          key={entry.id}
          entry={entry}
          occurredLabel={formatOccurred(entry.occurredAtIso)}
          columnOccurred={columnOccurred}
          columnActor={columnActor}
          columnEntity={columnEntity}
          columnDetails={columnDetails}
          technicalRecordTerm={technicalRecordTerm}
          technicalRecordHint={technicalRecordHint}
          technicalRecordHintAria={technicalRecordHintAria}
          reasonPrefix={reasonPrefix}
        />
      ))}
    </ul>
    <div className="hidden overflow-hidden rounded-xl border border-line bg-surface lg:block">
      <Table className="table-fixed">
        <colgroup>
          <col className="w-[14%]" />
          <col className="w-[18%]" />
          <col className="w-[20%]" />
          <col className="w-[24%]" />
          <col className="w-[24%]" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="px-card py-chip font-normal whitespace-normal break-words text-muted">
              {columnOccurred}
            </TableHead>
            <TableHead scope="col" className="px-card py-chip font-normal whitespace-normal break-words text-muted">
              {columnActor}
            </TableHead>
            <TableHead scope="col" className="px-card py-chip font-normal whitespace-normal break-words text-muted">
              {columnAction}
            </TableHead>
            <TableHead scope="col" className="px-card py-chip font-normal whitespace-normal break-words text-muted">
              {columnEntity}
            </TableHead>
            <TableHead scope="col" className="px-card py-chip font-normal whitespace-normal break-words text-muted">
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
              technicalRecordTerm={technicalRecordTerm}
              technicalRecordHint={technicalRecordHint}
              technicalRecordHintAria={technicalRecordHintAria}
              reasonPrefix={reasonPrefix}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  </>
);
