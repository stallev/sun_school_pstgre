import { USER_ROLE } from "@sunschool/domain";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { PupilCardForm } from "@/components/admin/PupilCardForm";
import { PupilRow } from "@/components/admin/PupilRow";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { CustomLink } from "@/components/ui/custom-link";
import { readConsentTextVersionFromDb } from "@/data/access/consent-text-version.server";
import {
  loadPeopleAdminList,
  parsePeopleListFilter,
  PEOPLE_LIST_FILTER,
} from "@/data/school/load-people-admin-list.server";
import { isoTodayUtc } from "@/data/school/school-pupil-shared.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { cn } from "@/lib/utils";

type PeoplePageProps = {
  searchParams: Promise<{ filter?: string }>;
};

const PeoplePage = async ({ searchParams }: PeoplePageProps) => {
  await requireRole(USER_ROLE.ADMIN);
  const prisma = await getPrisma();
  const { filter: filterRaw } = await searchParams;
  const filter = parsePeopleListFilter(filterRaw);

  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const adminMessages = pickAdminMessages(adminDict);
  const list = await loadPeopleAdminList(prisma, filter);
  const consentTextVersion = await readConsentTextVersionFromDb(prisma);
  const defaultDate = isoTodayUtc();
  const dictionaries = { admin: adminDict, common: commonDict };
  const formError = getMessage(commonDict, "errors.form");
  const closeLabel = adminMessages.form.cancel;

  const filters = [
    { key: PEOPLE_LIST_FILTER.ALL, href: "/people", label: adminMessages.people.filterAll },
    {
      key: PEOPLE_LIST_FILTER.UNASSIGNED,
      href: `/people?filter=${PEOPLE_LIST_FILTER.UNASSIGNED}`,
      label: adminMessages.people.filterUnassigned,
    },
    {
      key: PEOPLE_LIST_FILTER.INACTIVE,
      href: `/people?filter=${PEOPLE_LIST_FILTER.INACTIVE}`,
      label: adminMessages.people.filterInactive,
    },
  ];

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <div className="space-y-6">
        <PageHeader title={adminMessages.page.peopleTitle} />
        <nav className="flex flex-wrap gap-2" aria-label={adminMessages.people.filterAll}>
          {filters.map((item) => (
            <CustomLink
              key={item.key}
              href={item.href}
              className={cn(
                "inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm",
                filter === item.key
                  ? "bg-cobalt-soft text-ink"
                  : "bg-card text-muted-foreground hover:bg-paper",
              )}
            >
              {item.label}
            </CustomLink>
          ))}
        </nav>
        <PupilCardForm dictionaries={dictionaries} formError={formError} mode="create" />
        {list.pupils.length === 0 ? (
          <EmptyState
            title={adminMessages.people.emptyTitle}
            description={adminMessages.people.emptyDescription}
          />
        ) : (
          <ul className="overflow-hidden rounded-xl border border-line bg-surface divide-y divide-line">
            {list.pupils.map((row) => (
              <PupilRow
                key={row.pupilId}
                row={row}
                groups={list.groups}
                consentTextVersion={consentTextVersion}
                defaultDate={defaultDate}
                dictionaries={dictionaries}
                formError={formError}
                closeLabel={closeLabel}
                messages={adminMessages}
              />
            ))}
          </ul>
        )}
      </div>
    </AdminMessagesProvider>
  );
};

export default PeoplePage;
