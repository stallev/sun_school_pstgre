import { USER_ROLE } from "@sunschool/domain";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { DeletionRequestCard } from "@/components/admin/DeletionRequestCard";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { CustomLink } from "@/components/ui/custom-link";
import {
  DELETION_LIST_TAB,
  loadDeletionAdminList,
  parseDeletionListTab,
} from "@/data/deletions/load-deletion-admin-list.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { cn } from "@/lib/utils";

type DeletionsPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

const DeletionsPage = async ({ searchParams }: DeletionsPageProps) => {
  const actor = await requireRole(USER_ROLE.ADMIN);
  const prisma = await getPrisma();
  const { tab: tabRaw } = await searchParams;
  const tab = parseDeletionListTab(tabRaw);

  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const adminMessages = pickAdminMessages(adminDict);
  const rows = await loadDeletionAdminList(prisma, actor.userId, tab);
  const dictionaries = { admin: adminDict, common: commonDict };
  const formError = getMessage(commonDict, "errors.form");
  const closeLabel = adminMessages.form.cancel;
  const d = adminMessages.deletions;

  const tabs = [
    { key: DELETION_LIST_TAB.OPEN, href: "/deletions", label: d.tabOpen },
    { key: DELETION_LIST_TAB.DONE, href: `/deletions?tab=${DELETION_LIST_TAB.DONE}`, label: d.tabDone },
    {
      key: DELETION_LIST_TAB.CLOSED,
      href: `/deletions?tab=${DELETION_LIST_TAB.CLOSED}`,
      label: d.tabClosed,
    },
  ];

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
        <PageHeader title={adminMessages.page.deletionsTitle} description={d.pageSubtitle} />
        <nav
          className="-mb-px flex gap-1 overflow-x-auto border-b border-line"
          aria-label={d.tabNav}
          role="tablist"
        >
          {tabs.map((item) => (
            <CustomLink
              key={item.key}
              href={item.href}
              role="tab"
              aria-selected={tab === item.key}
              className={cn(
                "-mb-px inline-flex h-11 shrink-0 items-center border-b-2 px-3 text-[0.9375rem] transition-[color,border-color] duration-100",
                tab === item.key
                  ? "border-ink font-bold text-ink"
                  : "border-transparent text-ink-2 hover:text-ink",
              )}
            >
              {item.label}
            </CustomLink>
          ))}
        </nav>
        {rows.length === 0 ? (
          <EmptyState title={d.emptyTitle} description={d.emptyDescription} />
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <DeletionRequestCard
                key={row.requestId}
                row={row}
                messages={adminMessages}
                locale={locale}
                dictionaries={dictionaries}
                formError={formError}
                closeLabel={closeLabel}
              />
            ))}
          </ul>
        )}
      </div>
    </AdminMessagesProvider>
  );
};

export default DeletionsPage;
