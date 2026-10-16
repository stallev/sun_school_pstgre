import { USER_ROLE } from "@sunschool/domain";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { UserRow } from "@/components/admin/UserRow";
import { UsersStatusFilter } from "@/components/admin/UsersStatusFilter";
import { PageHeader } from "@/components/patterns/PageHeader";
import { runAdminLazyPurge } from "@/data/access/admin-lazy-purge.server";
import { loadUsersList, parseUsersStatusFilter } from "@/data/access/load-users-list.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";
import { getDictionary } from "@/lib/messages/get-dictionary";

type UsersPageProps = {
  searchParams: Promise<{ status?: string }>;
};

const UsersPage = async ({ searchParams }: UsersPageProps) => {
  await requireRole(USER_ROLE.ADMIN);
  const prisma = await getPrisma();
  await runAdminLazyPurge(prisma, new Date());

  const { status: statusRaw } = await searchParams;
  const statusFilter = parseUsersStatusFilter(statusRaw);

  const locale = await getUiLocale();
  const adminDict = await getDictionary(locale, "admin");
  const adminMessages = pickAdminMessages(adminDict);
  const users = await loadUsersList(prisma, statusFilter);

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <div className="space-y-6">
        <PageHeader title={adminMessages.page.usersTitle} />
        <UsersStatusFilter activeStatus={statusFilter} messages={adminMessages} />
        <div className="overflow-hidden rounded-xl border border-line bg-surface divide-y divide-line">
          {users.map((row) => (
            <UserRow key={row.userId} row={row} messages={adminMessages} />
          ))}
        </div>
      </div>
    </AdminMessagesProvider>
  );
};

export default UsersPage;
