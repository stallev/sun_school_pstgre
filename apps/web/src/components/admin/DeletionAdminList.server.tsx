import { connection } from "next/server";
import { USER_ROLE } from "@sunschool/domain";
import { DeletionRequestCard } from "@/components/admin/DeletionRequestCard";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
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
import type { AdminMessages } from "@/lib/messages/admin-messages";
import type { Dictionary, MessageLocale } from "@/lib/messages/get-dictionary";
import { cn } from "@/lib/utils";

type DeletionAdminListProps = {
  searchParams: Promise<{ tab?: string }>;
  messages: AdminMessages;
  locale: MessageLocale;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const DeletionAdminList = async ({
  searchParams,
  messages,
  locale,
  dictionaries,
  formError,
}: DeletionAdminListProps) => {
  await connection();
  const actor = await requireRole(USER_ROLE.ADMIN);
  const { tab: tabRaw } = await searchParams;
  const tab = parseDeletionListTab(tabRaw);
  const prisma = await getPrisma();
  const rows = await loadDeletionAdminList(prisma, actor.userId, tab);
  const closeLabel = messages.form.cancel;
  const d = messages.deletions;
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
    <AdminMessagesProvider messages={messages}>
      <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
        <PageHeader title={messages.page.deletionsTitle} description={d.pageSubtitle} />
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
                messages={messages}
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
