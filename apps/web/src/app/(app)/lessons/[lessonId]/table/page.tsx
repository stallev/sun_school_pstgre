import { USER_ROLE } from "@sunschool/domain";
import { notFound } from "next/navigation";
import { LessonCheckTable } from "@/components/teacher/LessonCheckTable";
import { loadLessonTablePage } from "@/data/checks/load-lesson-table-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary } from "@/lib/messages/get-dictionary";
import { pickTeacherCheckMessages } from "@/lib/messages/pick-teacher-check-messages.server";

type LessonTablePageProps = {
  params: Promise<{ lessonId: string }>;
};

const LessonTablePage = async ({ params }: LessonTablePageProps) => {
  const { lessonId } = await params;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const isAdmin = actor.roles.includes(USER_ROLE.ADMIN);
  const locale = await getUiLocale();
  const data = await loadLessonTablePage(await getPrisma(), actor.userId, lessonId, isAdmin);
  const [teacherDict, commonDict] = await Promise.all([
    getDictionary(locale, "teacher"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickTeacherCheckMessages(teacherDict, commonDict);
  const dictionaries = { teacher: teacherDict, common: commonDict };

  if (data.kind === "not_found") {
    notFound();
  }

  return <LessonCheckTable data={data} messages={messages} dictionaries={dictionaries} />;
};

export default LessonTablePage;
