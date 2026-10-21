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
import type { AdminMessages } from "@/lib/messages/admin-messages";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type YearPageContentProps = {
  messages: AdminMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const YearPageContent = async ({ messages, dictionaries, formError }: YearPageContentProps) => {
  await requireRole(USER_ROLE.ADMIN);
  const prisma = await getPrisma();
  const organizationId = await getDefaultOrganizationId(prisma);
  const years = await loadAcademicYearsList(prisma, organizationId);

  return (
    <AdminMessagesProvider messages={messages}>
      <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
        <PageHeader title={messages.page.yearTitle} />
        <CreateYearForm dictionaries={dictionaries} formError={formError} />
        {years.length === 0 ? (
          <EmptyState title={messages.year.emptyTitle} description={messages.year.emptyDescription} />
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
