import { ContentText } from "@/components/atoms/ContentText";
import type { AuditLogEntryDto } from "@/data/audit/audit-shared.server";

type AuditHistoryItemProps = {
  entry: AuditLogEntryDto;
  occurredLabel: string;
};

export const AuditHistoryItem = ({ entry, occurredLabel }: AuditHistoryItemProps) => (
  <li className="space-y-1 border-b border-line py-3 last:border-b-0">
    <ContentText className="text-sm tabular-nums text-muted-foreground">{occurredLabel}</ContentText>
    <ContentText className="text-sm font-medium text-ink">{entry.actionPhrase}</ContentText>
    <ContentText tone="secondary" className="text-sm">
      {entry.actorLabel}
      {entry.entityDisplay ? ` · ${entry.entityDisplay}` : null}
    </ContentText>
  </li>
);
