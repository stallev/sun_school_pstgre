import { connection } from "next/server";
import { USER_ROLE } from "@sunschool/domain";
import { ApprovalRow } from "@/components/admin/ApprovalRow";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { ContentText } from "@/components/atoms";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { runAdminLazyPurge } from "@/data/access/admin-lazy-purge.server";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { loadActiveGrades } from "@/data/access/load-active-grades.server";
import { loadPendingApprovals } from "@/data/access/load-pending-approvals.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

export const ApprovalsPageContent = async () => {
  await connection();
  await requireRole(USER_ROLE.ADMIN);
  const prisma = await getPrisma();
  const now = new Date();
  await runAdminLazyPurge(prisma, now);

  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const adminMessages = pickAdminMessages(adminDict);
  const organizationId = await getDefaultOrganizationId(prisma);
  const [rows, grades] = await Promise.all([
    loadPendingApprovals(prisma, now),
    loadActiveGrades(prisma, organizationId),
  ]);

  const dictionaries = { admin: adminDict, common: commonDict };
  const formError = getMessage(commonDict, "errors.form");
  const closeLabel = adminMessages.form.cancel;

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
        <PageHeader
          title={adminMessages.page.approvalsTitle}
          description={adminMessages.approvals.pageSubtitle}
        />
        {rows.length === 0 ? (
          <EmptyState
            title={adminMessages.approvals.emptyTitle}
            description={adminMessages.approvals.emptyDescription}
          />
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.requestId}>
                <ApprovalRow
                  row={row}
                  grades={grades}
                  submittedLabel={adminMessages.approvals.submitted}
                  dictionaries={dictionaries}
                  formError={formError}
                  closeLabel={closeLabel}
                />
              </li>
            ))}
          </ul>
        )}
        <ContentText tone="muted" className="text-sm">
          {adminMessages.approvals.footerNote}
        </ContentText>
      </div>
    </AdminMessagesProvider>
  );
};

