import { AUDIT_ENTITY_TYPE, USER_ROLE, type AuditEntityType } from "@sunschool/domain";
import { ContentText } from "@/components/atoms/ContentText";
import { AuditHistoryItem } from "@/components/admin/AuditEntryRow";
import { EmptyState } from "@/components/patterns/EmptyState";
import { getEntityHistory } from "@/data/audit/get-entity-history";
import { resolveAuditActionLabel } from "@/data/audit/audit-resolve-labels.server";
import { requireActiveUser, requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
type EntityHistoryListProps = {
  entityType: AuditEntityType;
  entityId: string;
};

export const EntityHistoryList = async ({ entityType, entityId }: EntityHistoryListProps) => {
  await requireRole(USER_ROLE.ADMIN);
  const actor = await requireActiveUser();
  const prisma = await getPrisma();
  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);

  const result = await getEntityHistory(
    prisma,
    actor.userId,
    entityType,
    entityId,
    adminDict,
    commonDict,
  );
  if (!result.ok) return null;

  const formatOccurred = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

  const title = getMessage(adminDict, "audit.history_title");
  const emptyTitle = getMessage(adminDict, "audit.history_empty_title");
  const emptyDescription = getMessage(adminDict, "audit.history_empty_description");

  return (
    <section className="space-y-3" aria-labelledby="entity-history-heading">
      <ContentText id="entity-history-heading" className="font-medium text-ink">{title}</ContentText>
      {result.data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="rounded-xl border border-line bg-surface px-4">
          {result.data.map((entry) => (
            <AuditHistoryItem
              key={entry.id}
              entry={entry}
              occurredLabel={formatOccurred(entry.occurredAtIso)}
              actionLabel={resolveAuditActionLabel(adminDict, entry.action)}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

export const UserEntityHistoryList = ({ userId }: { userId: string }) => (
  <EntityHistoryList entityType={AUDIT_ENTITY_TYPE.APP_USER} entityId={userId} />
);

export const PupilEntityHistoryList = ({ pupilId }: { pupilId: string }) => (
  <EntityHistoryList entityType={AUDIT_ENTITY_TYPE.PUPIL} entityId={pupilId} />
);
