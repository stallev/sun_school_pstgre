import { CustomLink } from "@/components/ui/custom-link";
import { RecordCard } from "@/components/patterns/RecordCard";
import { AuditChangeList } from "@/components/admin/AuditChangeList";
import { AuditTechnicalRecord } from "@/components/admin/AuditTechnicalRecord";
import type { AuditLogEntryDto } from "@/data/audit/audit-shared.server";

type AuditEntryCardProps = {
  entry: AuditLogEntryDto;
  occurredLabel: string;
  columnOccurred: string;
  columnActor: string;
  columnEntity: string;
  columnDetails: string;
  technicalRecordTerm: string;
  technicalRecordHint: string;
  technicalRecordHintAria: string;
  reasonPrefix: string;
};

export const AuditEntryCard = ({
  entry,
  occurredLabel,
  columnOccurred,
  columnActor,
  columnEntity,
  columnDetails,
  technicalRecordTerm,
  technicalRecordHint,
  technicalRecordHintAria,
  reasonPrefix,
}: AuditEntryCardProps) => (
  <RecordCard
    title={entry.actionPhrase}
    fields={[
      { label: columnOccurred, value: <span className="tabular-nums">{occurredLabel}</span> },
      { label: columnActor, value: entry.actorLabel },
      {
        label: columnEntity,
        value: entry.entityHref ? (
          <CustomLink href={entry.entityHref} className="text-cobalt-ink" title={entry.entityIdTitle}>
            {entry.entityDisplay}
          </CustomLink>
        ) : (
          <span title={entry.entityIdTitle}>{entry.entityDisplay}</span>
        ),
      },
      {
        label: columnDetails,
        value: (
          <>
            <AuditChangeList
              lines={entry.changeLines}
              reason={entry.reason}
              reasonPrefix={reasonPrefix}
            />
            <AuditTechnicalRecord
              term={technicalRecordTerm}
              hint={technicalRecordHint}
              hintAriaLabel={technicalRecordHintAria}
              json={entry.technicalRecordJson}
            />
          </>
        ),
        wide: true,
      },
    ]}
  />
);
