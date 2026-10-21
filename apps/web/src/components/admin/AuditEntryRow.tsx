import { ContentText } from "@/components/atoms/ContentText";
import { CustomLink } from "@/components/ui/custom-link";
import { TableCell, TableRow } from "@/components/ui/table";
import type { AuditLogEntryDto } from "@/data/audit/audit-shared.server";

type AuditEntryRowProps = {
  entry: AuditLogEntryDto;
  occurredLabel: string;
  actionLabel: string;
};

export const AuditEntryRow = ({ entry, occurredLabel, actionLabel }: AuditEntryRowProps) => (
  <TableRow>
    <TableCell className="px-5 py-4 whitespace-nowrap tabular-nums text-sm text-muted">
      {occurredLabel}
    </TableCell>
    <TableCell className="px-5 py-4 text-sm font-medium">{entry.actorLabel}</TableCell>
    <TableCell className="px-5 py-4 text-sm">{actionLabel}</TableCell>
    <TableCell className="px-5 py-4 text-sm">
      {entry.entityHref ? (
        <CustomLink href={entry.entityHref} className="text-cobalt-ink hover:underline">
          {entry.entityLabel}
        </CustomLink>
      ) : (
        entry.entityLabel
      )}
    </TableCell>
    <TableCell className="max-w-[12rem] truncate px-5 py-4 text-sm text-ink-2">
      {entry.reason ?? entry.newValueText ?? entry.oldValueText ?? "—"}
    </TableCell>
  </TableRow>
);

type AuditHistoryItemProps = {
  entry: AuditLogEntryDto;
  occurredLabel: string;
  actionLabel: string;
};

export const AuditHistoryItem = ({ entry, occurredLabel, actionLabel }: AuditHistoryItemProps) => (
  <li className="space-y-1 border-b border-line py-3 last:border-b-0">
    <ContentText className="text-sm tabular-nums text-muted-foreground">{occurredLabel}</ContentText>
    <ContentText className="text-sm font-medium text-ink">{actionLabel}</ContentText>
    <ContentText tone="secondary" className="text-sm">
      {entry.actorLabel}
      {entry.reason ? ` · ${entry.reason}` : null}
    </ContentText>
  </li>
);
