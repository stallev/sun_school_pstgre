import { connection } from "next/server";
import { notFound } from "next/navigation";
import { USER_ROLE } from "@sunschool/domain";
import { GroupPointsTable } from "@/components/achievements/GroupPointsTable.client";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { loadAdminGroupPointsPage } from "@/data/achievements/load-group-points-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { fillMessage } from "@/lib/messages/fill-message";
import { getDictionary } from "@/lib/messages/get-dictionary";
import { pickGroupPointsMessages } from "@/lib/messages/pick-group-points-messages.server";

export type AdminGroupPointsPageProps = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ year?: string }>;
};

export const AdminGroupPointsPageContent = async ({
  params,
  searchParams,
}: AdminGroupPointsPageProps) => {
  await connection();
  const actor = await requireRole(USER_ROLE.ADMIN);
  const { groupId } = await params;
  const query = await searchParams;
  const locale = await getUiLocale();
  const [teacherDict, adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "teacher"),
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickGroupPointsMessages(teacherDict, adminDict, commonDict);
  const dictionaries = { teacher: teacherDict, admin: adminDict, common: commonDict };

  const data = await loadAdminGroupPointsPage(
    await getPrisma(),
    actor.userId,
    groupId,
    query.year,
    messages.tierLabels,
  );

  if (data.kind === "flag_off") notFound();
  if (data.kind === "not_found") notFound();
  if (data.kind === "empty_catalog") {
    return (
      <PageSection className="space-y-6">
        <PageHeader title={messages.pageTitle} />
        <EmptyState title={messages.emptyCatalogTitle} description={messages.emptyCatalogDescription} />
      </PageSection>
    );
  }
  if (data.kind !== "editor") notFound();

  const editor = data.data;
  return (
    <PageSection width="wide" className="space-y-6">
      <PageHeader
        title={messages.pageTitle}
        description={fillMessage(messages.pageSubtitleTemplate, {
          group: editor.gradeName,
          year: editor.yearName,
        })}
      />
      <GroupPointsTable
        editor={editor}
        pagePath={`/groups/${groupId}/points`}
        messages={messages}
        dictionaries={dictionaries}
      />
    </PageSection>
  );
};
