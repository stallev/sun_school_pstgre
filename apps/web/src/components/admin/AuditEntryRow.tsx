import { CustomLink } from "@/components/ui/custom-link";
import { TableCell, TableRow } from "@/components/ui/table";
import { AuditChangeList } from "@/components/admin/AuditChangeList";
import { AuditTechnicalRecord } from "@/components/admin/AuditTechnicalRecord";
import type { AuditLogEntryDto } from "@/data/audit/audit-shared.server";

type AuditEntryRowProps = {
  entry: AuditLogEntryDto;
  occurredLabel: string;
  technicalRecordTerm: string;
  technicalRecordHint: string;
  technicalRecordHintAria: string;
  reasonPrefix: string;
};

export const AuditEntryRow = ({
  entry,
  occurredLabel,
  technicalRecordTerm,
  technicalRecordHint,
  technicalRecordHintAria,
  reasonPrefix,
}: AuditEntryRowProps) => (
  <TableRow>
    <TableCell className="px-card py-stack align-top whitespace-normal break-words tabular-nums text-sm text-muted">
      {occurredLabel}
    </TableCell>
    <TableCell className="px-card py-stack align-top whitespace-normal break-words text-sm font-medium">
      {entry.actorLabel}
    </TableCell>
    <TableCell className="px-card py-stack align-top whitespace-normal break-words text-sm">
      {entry.actionPhrase}
    </TableCell>
    <TableCell className="px-card py-stack align-top whitespace-normal break-words text-sm" title={entry.entityIdTitle || undefined}>
      {entry.entityHref ? (
        <CustomLink href={entry.entityHref} className="text-cobalt-ink" title={entry.entityIdTitle || undefined}>
          {entry.entityDisplay}
        </CustomLink>
      ) : (
        <span title={entry.entityIdTitle || undefined}>{entry.entityDisplay}</span>
      )}
    </TableCell>
    <TableCell className="min-w-0 px-card py-stack align-top whitespace-normal break-words">
      <AuditChangeList lines={entry.changeLines} reason={entry.reason} reasonPrefix={reasonPrefix} />
      <AuditTechnicalRecord
        term={technicalRecordTerm}
        hint={technicalRecordHint}
        hintAriaLabel={technicalRecordHintAria}
        json={entry.technicalRecordJson}
      />
    </TableCell>
  </TableRow>
);
