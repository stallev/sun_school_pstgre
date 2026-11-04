import { CustomLink } from "@/components/ui/custom-link";
import { TableCell, TableRow } from "@/components/ui/table";
import { AuditChangeList } from "@/components/admin/AuditChangeList";
import { AuditTechnicalRecord } from "@/components/admin/AuditTechnicalRecord";
import type { AuditLogEntryDto } from "@/data/audit/audit-shared.server";

type AuditEntryRowProps = {
  entry: AuditLogEntryDto;
  occurredLabel: string;
  technicalRecordLabel: string;
  reasonPrefix: string;
};

export const AuditEntryRow = ({
  entry,
  occurredLabel,
  technicalRecordLabel,
  reasonPrefix,
}: AuditEntryRowProps) => (
  <TableRow>
    <TableCell className="px-5 py-4 align-top whitespace-nowrap tabular-nums text-sm text-muted">
      {occurredLabel}
    </TableCell>
    <TableCell className="px-5 py-4 align-top text-sm font-medium">{entry.actorLabel}</TableCell>
    <TableCell className="px-5 py-4 align-top text-sm">{entry.actionPhrase}</TableCell>
    <TableCell className="px-5 py-4 align-top text-sm" title={entry.entityIdTitle}>
      {entry.entityHref ? (
        <CustomLink href={entry.entityHref} className="text-cobalt-ink" title={entry.entityIdTitle}>
          {entry.entityDisplay}
        </CustomLink>
      ) : (
        <span title={entry.entityIdTitle}>{entry.entityDisplay}</span>
      )}
    </TableCell>
    <TableCell className="min-w-0 px-5 py-4 align-top">
      <AuditChangeList lines={entry.changeLines} reason={entry.reason} reasonPrefix={reasonPrefix} />
      <AuditTechnicalRecord summaryLabel={technicalRecordLabel} json={entry.technicalRecordJson} />
    </TableCell>
  </TableRow>
);
