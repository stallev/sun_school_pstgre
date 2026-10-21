import { USER_ROLE } from "@sunschool/domain";
import { CreateYearForm } from "@/components/admin/CreateYearForm.client";
import { YearCard } from "@/components/admin/YearCard";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { loadAcademicYearsList } from "@/data/school/load-academic-years-list.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const YearPage = async () => {
  await requireRole(USER_ROLE.ADMIN);
  const prisma = await getPrisma();
  const organizationId = await getDefaultOrganizationId(prisma);
  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const adminMessages = pickAdminMessages(adminDict);
  const years = await loadAcademicYearsList(prisma, organizationId);
  const dictionaries = { admin: adminDict, common: commonDict };
  const formError = getMessage(commonDict, "errors.form");

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
        <PageHeader title={adminMessages.page.yearTitle} />
        <CreateYearForm dictionaries={dictionaries} formError={formError} />
        {years.length === 0 ? (
          <EmptyState
            title={adminMessages.year.emptyTitle}
            description={adminMessages.year.emptyDescription}
          />
        ) : (
          <ul className="grid items-stretch gap-4 lg:grid-cols-2">
            {years.map((row) => (
              <li key={row.yearId} className="h-full">
                <YearCard row={row} dictionaries={dictionaries} formError={formError} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminMessagesProvider>
  );
};

export default YearPage;
