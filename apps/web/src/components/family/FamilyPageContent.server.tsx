import { connection } from "next/server";
import { notFound } from "next/navigation";
import { USER_ROLE } from "@sunschool/domain";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { FamilyCreateDialog } from "@/components/family/FamilyCreateDialog.client";
import { FamilyDetailBoard } from "@/components/family/FamilyDetailBoard.client";
import { FamilyListRow } from "@/components/family/FamilyListRow";
import { FamilyEntityHistoryList } from "@/components/admin/EntityHistoryList";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { ForbiddenState } from "@/components/patterns/ForbiddenState";
import { CustomLink } from "@/components/ui/custom-link";
import { readConsentTextVersionFromDb } from "@/data/access/consent-text-version.server";
import {
  loadFamiliesAdminList,
  loadFamilyAdminDetail,
  loadPupilsForFamilyAttach,
} from "@/data/families/load-families-admin.server";
import { readFeaturesParentsEnabled } from "@/data/families/family-feature.server";
import { isoTodayUtc } from "@/data/school/school-pupil-shared.server";
import { requireActiveUser } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";
import { pickFamilyAdminMessages } from "@/lib/messages/pick-family-admin-messages.server";
import { pickAdminHintsSubset } from "@/lib/messages/pick-admin-hints-messages.server";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

export type FamilyPageProps = {
  searchParams: Promise<{ id?: string }>;
};

export const FamilyPageContent = async ({ searchParams }: FamilyPageProps) => {
  await connection();
  const context = await requireActiveUser();
  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickFamilyAdminMessages(adminDict, commonDict);
  const adminMessages = pickAdminMessages(adminDict);
  const familyHints = pickAdminHintsSubset(adminDict, ["family_login"] as const);
  const dictionaries = { admin: adminDict, common: commonDict };
  const prisma = await getPrisma();
  const flagOn = await prisma.$transaction((tx) => readFeaturesParentsEnabled(tx));

  if (!context.roles.includes(USER_ROLE.ADMIN)) {
    if (!flagOn) notFound();
    return (
      <ForbiddenState
        title={getMessage(commonDict, "errors.forbidden_title")}
        description={getMessage(commonDict, "errors.forbidden")}
        action={
          <CustomLink href="/today">{getMessage(commonDict, "shell.forbidden_home")}</CustomLink>
        }
      />
    );
  }

  if (!flagOn) notFound();

  const { id: familyId } = await searchParams;
  const deletedUserTemplate = getMessage(commonDict, "person.deleted_user");

  if (familyId) {
    const [detailResult, attachResult, consentTextVersion] = await Promise.all([
      loadFamilyAdminDetail(prisma, context.userId, familyId, deletedUserTemplate),
      loadPupilsForFamilyAttach(prisma, context.userId),
      readConsentTextVersionFromDb(prisma),
    ]);
    if (!detailResult.ok) notFound();
    const attachOptions = attachResult.ok ? attachResult.data : [];
    const createdLabel = messages.createdLabel.replace(
      "{date}",
      new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(
        new Date(detailResult.data.createdAtIso),
      ),
    );

    return (
      <AdminMessagesProvider messages={adminMessages}>
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 lg:py-8">
          <FamilyDetailBoard
          detail={detailResult.data}
          attachOptions={attachOptions}
          messages={messages}
          dictionaries={dictionaries}
          uiLocale={locale}
          consentTextVersion={consentTextVersion}
          defaultSignedOn={isoTodayUtc()}
          createdLabel={createdLabel}
          journalSlot={
            <FamilyEntityHistoryList familyId={familyId} sectionTitle={messages.sectionJournal} />
          }
          />
        </div>
      </AdminMessagesProvider>
    );
  }

  const listResult = await loadFamiliesAdminList(prisma, context.userId);
  if (!listResult.ok) notFound();

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 lg:py-8">
      <PageHeader
        title={messages.pageTitle}
        description={messages.pageSubtitle}
        actions={<FamilyCreateDialog messages={messages} dictionaries={dictionaries} />}
      />
      {listResult.data.families.length === 0 ? (
        <EmptyState title={messages.emptyTitle} description={messages.emptyDescription} />
      ) : (
        <>
          <TermLabel
            term={nonEmptyTerm(familyHints.family_login.term)}
            hint={familyHints.family_login.hint}
            ariaLabel={familyHints.family_login.term}
            className="text-sm text-ink-2"
            popoverSide="top"
          />
          <ul className="overflow-hidden rounded-xl border border-line bg-card divide-y divide-line">
            {listResult.data.families.map((row) => (
              <FamilyListRow key={row.familyId} row={row} messages={messages} />
            ))}
          </ul>
        </>
      )}
      {listResult.data.unassignedPupilCount > 0 ? (
        <div className="space-y-2 text-sm text-ink-2">
          <p>
            {messages.unassignedNote.replace(
              "{count}",
              String(listResult.data.unassignedPupilCount),
            )}{" "}
            {messages.unassignedExplanation}
          </p>
          <CustomLink href="/people" className="font-medium text-cobalt-ink hover:underline">
            {messages.unassignedAssignLink}
          </CustomLink>
        </div>
      ) : null}
      </div>
    </AdminMessagesProvider>
  );
};
