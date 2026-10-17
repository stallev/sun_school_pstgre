import { USER_ROLE } from "@sunschool/domain";
import { notFound } from "next/navigation";
import { LessonCard } from "@/components/teacher/LessonCard";
import { PageHeader } from "@/components/patterns/PageHeader";
import { CustomLink } from "@/components/ui/custom-link";
import { loadLessonDetailPage } from "@/data/lessons/load-lesson-detail-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickTeacherLessonFormMessages } from "@/lib/messages/pick-teacher-lesson-messages.server";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";

type LessonDetailPageProps = {
  params: Promise<{ lessonId: string }>;
};

const LessonDetailPage = async ({ params }: LessonDetailPageProps) => {
  const { lessonId } = await params;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const data = await loadLessonDetailPage(await getPrisma(), actor.userId, lessonId, appLocale);
  const [teacherDict, commonDict] = await Promise.all([
    getDictionary(locale, "teacher"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickTeacherLessonScreensMessages(teacherDict, appLocale);
  const formMessages = pickTeacherLessonFormMessages(teacherDict, appLocale);
  const dictionaries = { teacher: teacherDict, common: commonDict };
  const formError = getMessage(commonDict, "errors.form");

  if (data.kind === "not_found") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.lessonCardTitle(data.ordinal, data.title)}
        description={messages.listSubtitle(data.gradeName, data.yearName)}
        actions={
          <CustomLink href="/lessons" className="text-sm text-cobalt-ink">
            {formMessages.backToLessons}
          </CustomLink>
        }
      />
      <LessonCard
        data={data}
        messages={messages}
        dictionaries={dictionaries}
        formError={formError}
      />
    </div>
  );
};

export default LessonDetailPage;
