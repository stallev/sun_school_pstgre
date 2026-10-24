import { connection } from "next/server";
import { notFound } from "next/navigation";
import { USER_ROLE } from "@sunschool/domain";
import { GroupPointsTable } from "@/components/achievements/GroupPointsTable.client";
import { Banner } from "@/components/patterns/Banner";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { loadTeacherGroupPointsPage } from "@/data/achievements/load-group-points-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { fillMessage } from "@/lib/messages/fill-message";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickGroupPointsMessages } from "@/lib/messages/pick-group-points-messages.server";

export type TeacherGroupPointsPageProps = {
  searchParams: Promise<{ year?: string }>;
};

export const TeacherGroupPointsPageContent = async ({
  searchParams,
}: TeacherGroupPointsPageProps) => {
  await connection();
  const actor = await requireRole(USER_ROLE.TEACHER);
  const params = await searchParams;
  const locale = await getUiLocale();
  const [teacherDict, adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "teacher"),
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickGroupPointsMessages(teacherDict, adminDict, commonDict);
  const dictionaries = { teacher: teacherDict, admin: adminDict, common: commonDict };

  const data = await loadTeacherGroupPointsPage(
    await getPrisma(),
    actor.userId,
    params.year,
    messages.tierLabels,
  );

  if (data.kind === "flag_off") notFound();
  if (data.kind === "not_found") notFound();
  if (data.kind === "no_active_year") {
    return (
      <PageSection className="space-y-6">
        <PageHeader title={messages.pageTitle} />
        <EmptyState
          title={getMessage(teacherDict, "group.no_year_title")}
          description={getMessage(teacherDict, "group.no_year_description")}
        />
      </PageSection>
    );
  }
  if (data.kind === "unassigned") {
    return (
      <PageSection className="space-y-6">
        <PageHeader title={messages.pageTitle} />
        <EmptyState
          title={getMessage(teacherDict, "group.unassigned_title")}
          description={getMessage(teacherDict, "group.unassigned_description")}
        />
      </PageSection>
    );
  }
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
      {editor.yearClosed && !editor.canMutate ? (
        <Banner tone="warning" title={messages.yearClosedTitle}>
          <p>{messages.yearClosedDescription}</p>
        </Banner>
      ) : null}
      <GroupPointsTable
        editor={editor}
        pagePath="/group/points"
        messages={messages}
        dictionaries={dictionaries}
      />
    </PageSection>
  );
};
