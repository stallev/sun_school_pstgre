import { USER_ROLE } from "@sunschool/domain";
import { notFound } from "next/navigation";
import { Banner } from "@/components/patterns/Banner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { CustomLink } from "@/components/ui/custom-link";
import { loadLessonDetailPage } from "@/data/lessons/load-lesson-detail-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary } from "@/lib/messages/get-dictionary";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";

type LessonCheckStubPageProps = {
  params: Promise<{ lessonId: string }>;
};

const LessonCheckStubPage = async ({ params }: LessonCheckStubPageProps) => {
  const { lessonId } = await params;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const data = await loadLessonDetailPage(await getPrisma(), actor.userId, lessonId, appLocale);
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickTeacherLessonScreensMessages(teacherDict, appLocale);

  if (data.kind === "not_found") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.checkStubTitle}
        description={messages.lessonCardTitle(data.ordinal, data.title)}
        actions={
          <CustomLink href={`/lessons/${lessonId}`} className="text-sm text-cobalt-ink">
            {messages.checkStubBack}
          </CustomLink>
        }
      />
      <Banner tone="info" title={messages.checkStubTitle}>
        <p>{messages.checkStubDescription}</p>
      </Banner>
    </div>
  );
};

export default LessonCheckStubPage;
