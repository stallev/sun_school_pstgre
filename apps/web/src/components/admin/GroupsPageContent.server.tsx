import { connection } from "next/server";
import { USER_ROLE } from "@sunschool/domain";
import { CreateGroupForm } from "@/components/admin/CreateGroupForm.client";
import { GroupCard } from "@/components/admin/GroupCard";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { loadGroupsAdminList } from "@/data/school/load-groups-admin-list.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { formatYearContext } from "@/lib/messages/admin-messages";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

export const GroupsPageContent = async () => {
  await connection();
  await requireRole(USER_ROLE.ADMIN);
  const prisma = await getPrisma();
  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const adminMessages = pickAdminMessages(adminDict);
  const list = await loadGroupsAdminList(prisma);
  const dictionaries = { admin: adminDict, common: commonDict };
  const formError = getMessage(commonDict, "errors.form");
  const noYear = list.yearId === null;

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <PageSection width="full" className="min-w-0 space-y-6 overflow-x-hidden">
        <PageHeader
          title={adminMessages.page.groupsTitle}
          description={
            list.yearName ? formatYearContext(adminMessages.group.yearContext, list.yearName) : undefined
          }
        />
        <CreateGroupForm dictionaries={dictionaries} formError={formError} disabled={noYear} />
        {noYear ? (
          <EmptyState
            title={adminMessages.group.emptyNoYearTitle}
            description={adminMessages.group.emptyNoYearDescription}
            action={
              <Button render={<CustomLink href="/year" />}>{adminMessages.group.emptyNoYearAction}</Button>
            }
          />
        ) : list.groups.length === 0 ? (
          <EmptyState
            title={adminMessages.group.emptyTitle}
            description={adminMessages.group.emptyDescription}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface divide-y divide-line">
            {list.groups.map((row) => (
              <GroupCard key={row.gradeId} row={row} messages={adminMessages} />
            ))}
          </div>
        )}
      </PageSection>
    </AdminMessagesProvider>
  );
};

