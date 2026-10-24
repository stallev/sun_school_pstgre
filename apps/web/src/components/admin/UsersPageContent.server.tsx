import { connection } from "next/server";
import { ACCOUNT_STATUS, USER_ROLE } from "@sunschool/domain";
import { ContentText } from "@/components/atoms";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { UserRow } from "@/components/admin/UserRow";
import { UsersStatusFilter } from "@/components/admin/UsersStatusFilter";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { runAdminLazyPurge } from "@/data/access/admin-lazy-purge.server";
import {
  loadUsersList,
  loadUsersStatusCounts,
  parseUsersStatusFilter,
} from "@/data/access/load-users-list.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";
import { getDictionary } from "@/lib/messages/get-dictionary";

export type UsersPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export const UsersPageContent = async ({
  searchParams }: UsersPageProps) => {
  await connection();
  await requireRole(USER_ROLE.ADMIN);
  const prisma = await getPrisma();
  await runAdminLazyPurge(prisma, new Date());

  const { status: statusRaw } = await searchParams;
  const statusFilter = parseUsersStatusFilter(statusRaw);

  const locale = await getUiLocale();
  const adminDict = await getDictionary(locale, "admin");
  const adminMessages = pickAdminMessages(adminDict);
  const [users, statusCounts] = await Promise.all([
    loadUsersList(prisma, statusFilter),
    loadUsersStatusCounts(prisma),
  ]);

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <PageSection width="full" className="min-w-0 space-y-6 overflow-x-hidden">
        <PageHeader
          title={adminMessages.page.usersTitle}
          description={adminMessages.users.pageSubtitle}
        />
        <UsersStatusFilter
          activeStatus={statusFilter}
          counts={statusCounts}
          messages={adminMessages}
        />
        {users.length === 0 ? (
          <EmptyState
            title={adminMessages.users.listEmpty}
            description={
              statusFilter === ACCOUNT_STATUS.REGISTRATION
                ? adminMessages.users.registrationFooterNote
                : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {users.map((row) => (
              <UserRow key={row.userId} row={row} messages={adminMessages} />
            ))}
          </ul>
        )}
        {statusFilter === ACCOUNT_STATUS.REGISTRATION && users.length > 0 ? (
          <ContentText tone="muted" className="text-sm">
            {adminMessages.users.registrationFooterNote}
          </ContentText>
        ) : null}
      </PageSection>
    </AdminMessagesProvider>
  );
};

