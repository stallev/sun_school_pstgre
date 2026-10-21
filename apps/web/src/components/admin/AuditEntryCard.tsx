import { CustomLink } from "@/components/ui/custom-link";
import { RecordCard } from "@/components/patterns/RecordCard";
import type { AuditLogEntryDto } from "@/data/audit/audit-shared.server";

type AuditEntryCardProps = {
  entry: AuditLogEntryDto;
  occurredLabel: string;
  actionLabel: string;
  columnOccurred: string;
  columnActor: string;
  columnEntity: string;
  columnDetails: string;
};

const detailsText = (entry: AuditLogEntryDto): string =>
  entry.reason ?? entry.newValueText ?? entry.oldValueText ?? "—";

export const AuditEntryCard = ({
  entry,
  occurredLabel,
  actionLabel,
  columnOccurred,
  columnActor,
  columnEntity,
  columnDetails,
}: AuditEntryCardProps) => (
  <RecordCard
    title={actionLabel}
    fields={[
      { label: columnOccurred, value: <span className="tabular-nums">{occurredLabel}</span> },
      { label: columnActor, value: entry.actorLabel },
      {
        label: columnEntity,
        value: entry.entityHref ? (
          <CustomLink href={entry.entityHref} className="text-cobalt-ink hover:underline">
            {entry.entityLabel}
          </CustomLink>
        ) : (
          entry.entityLabel
        ),
      },
      { label: columnDetails, value: detailsText(entry), wide: true },
    ]}
  />
);
