import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ACADEMIC_YEAR_STATUS, USER_ROLE } from "@sunschool/domain";
import { GroupAchievementModeSection } from "@/components/achievements/GroupAchievementModeSection.server";
import { GroupSettingsForm } from "@/components/admin/GroupSettingsForm";
import { TeacherAssignmentList } from "@/components/admin/TeacherAssignmentList";
import { AdminMessagesProvider } from "@/components/admin/admin-messages-provider.client";
import { PageHeader } from "@/components/patterns/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { loadGroupAdminDetail } from "@/data/school/load-group-admin-detail.server";
import { loadTeacherCandidates } from "@/data/school/load-teacher-candidates.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { formatYearContext } from "@/lib/messages/admin-messages";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

export type GroupDetailPageProps = {
  params: Promise<{ groupId: string }>;
};

export const GroupDetailPageContent = async ({ params }: GroupDetailPageProps) => {
  await connection();
  await requireRole(USER_ROLE.ADMIN);
  const { groupId } = await params;
  const prisma = await getPrisma();
  const [detail, candidates] = await Promise.all([
    loadGroupAdminDetail(prisma, groupId),
    loadTeacherCandidates(prisma),
  ]);
  if (!detail) notFound();

  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const adminMessages = pickAdminMessages(adminDict);
  const dictionaries = { admin: adminDict, common: commonDict };
  const formError = getMessage(commonDict, "errors.form");

  return (
    <AdminMessagesProvider messages={adminMessages}>
      <PageSection width="wide" className="min-w-0 space-y-6 overflow-x-hidden">
        <PageHeader
          title={detail.name}
          description={formatYearContext(adminMessages.group.editSubtitle, detail.yearName)}
        />
        <GroupAchievementModeSection
          gradeId={detail.gradeId}
          academicYearId={detail.yearId}
          canMutate={detail.yearStatus === ACADEMIC_YEAR_STATUS.ACTIVE}
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
          <GroupSettingsForm
            key={`${detail.gradeId}-${detail.language}`}
            detail={detail}
            dictionaries={dictionaries}
            formError={formError}
          />
          <TeacherAssignmentList
            detail={detail}
            candidates={candidates}
            dictionaries={dictionaries}
            formError={formError}
          />
        </div>
      </PageSection>
    </AdminMessagesProvider>
  );
};

