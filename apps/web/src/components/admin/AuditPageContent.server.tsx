import { connection } from "next/server";
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE, USER_ROLE } from "@sunschool/domain";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { AuditFilterBar } from "@/components/admin/AuditFilterBar";
import { AuditTable } from "@/components/admin/AuditTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { CustomLink } from "@/components/ui/custom-link";
import { listAuditLog } from "@/data/audit/list-audit-log";
import { loadAuditActorOptions } from "@/data/audit/load-audit-actor-options.server";
import { parseAuditLogFilter } from "@/data/audit/parse-audit-filters.server";
import { resolveAuditActionLabel } from "@/data/audit/audit-resolve-labels.server";
import { requireActiveUser, requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

export type AuditPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    actor?: string;
    entityType?: string;
    action?: string;
    cursor?: string;
  }>;
};

export const AuditPageContent = async ({
  searchParams }: AuditPageProps) => {
  await connection();
  await requireRole(USER_ROLE.ADMIN);
  const actor = await requireActiveUser();
  const prisma = await getPrisma();
  const params = await searchParams;
  const filter = parseAuditLogFilter(params);
  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const adminMessages = pickAdminMessages(adminDict);
  const deletedUserTemplate = getMessage(commonDict, "person.deleted_user");

  const listResult = await listAuditLog(
    prisma,
    actor.userId,
    filter,
    { cursor: params.cursor },
    adminDict,
    commonDict,
  );
  const entries = listResult.ok ? listResult.data.entries : [];
  const nextCursor = listResult.ok ? listResult.data.nextCursor : null;
  const actorOptions = await loadAuditActorOptions(prisma, deletedUserTemplate);

  const formatOccurred = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

  const entityTypeLabels = Object.fromEntries(
    Object.values(AUDIT_ENTITY_TYPE).map((type) => [
      type,
      getMessage(adminDict, `audit.entity_types.${type}`),
    ]),
  );
  const actionLabels = Object.fromEntries(
    Object.values(AUDIT_ACTION).map((action) => [
      action,
      resolveAuditActionLabel(adminDict, action),
    ]),
  );

  const query = new URLSearchParams();
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.actor) query.set("actor", params.actor);
  if (params.entityType) query.set("entityType", params.entityType);
  if (params.action) query.set("action", params.action);
  if (nextCursor) query.set("cursor", nextCursor);
  const nextHref = nextCursor ? `/audit?${query.toString()}` : null;

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
        <PageHeader
          title={getMessage(adminDict, "audit.page_title")}
          description={getMessage(adminDict, "audit.page_subtitle")}
        />
        <AuditFilterBar
          values={{
            from: params.from ?? "",
            to: params.to ?? "",
            actor: params.actor ?? "",
            entityType: params.entityType ?? "",
            action: params.action ?? "",
          }}
          actorOptions={actorOptions}
          labels={{
            from: getMessage(adminDict, "audit.filter_from"),
            to: getMessage(adminDict, "audit.filter_to"),
            actor: getMessage(adminDict, "audit.filter_actor"),
            entityType: getMessage(adminDict, "audit.filter_entity_type"),
            action: getMessage(adminDict, "audit.filter_action"),
            all: getMessage(adminDict, "audit.filter_all"),
            submit: getMessage(adminDict, "audit.filter_submit"),
            reset: getMessage(adminDict, "audit.filter_reset"),
            entityTypeLabels,
            actionLabels,
          }}
        />
        {entries.length === 0 ? (
          <EmptyState
            title={getMessage(adminDict, "audit.empty_title")}
            description={getMessage(adminDict, "audit.empty_description")}
          />
        ) : (
          <AuditTable
            entries={entries}
            formatOccurred={formatOccurred}
            formatAction={(action) => resolveAuditActionLabel(adminDict, action)}
            columnOccurred={getMessage(adminDict, "audit.column_occurred")}
            columnActor={getMessage(adminDict, "audit.column_actor")}
            columnAction={getMessage(adminDict, "audit.column_action")}
            columnEntity={getMessage(adminDict, "audit.column_entity")}
            columnDetails={getMessage(adminDict, "audit.column_details")}
          />
        )}
        {nextHref ? (
          <CustomLink href={nextHref} className="inline-flex min-h-11 items-center text-cobalt-ink">
            {getMessage(adminDict, "audit.load_more")}
          </CustomLink>
        ) : null}
      </div>
    </AdminMessagesProvider>
  );
};

