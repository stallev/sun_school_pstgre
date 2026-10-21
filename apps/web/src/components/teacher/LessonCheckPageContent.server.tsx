import { connection } from "next/server";
import { USER_ROLE } from "@sunschool/domain";
import { notFound } from "next/navigation";
import { CheckScreen } from "@/components/teacher/check-screen.client";
import { loadSequentialCheckPage } from "@/data/checks/load-sequential-check-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary } from "@/lib/messages/get-dictionary";
import { pickTeacherCheckMessages } from "@/lib/messages/pick-teacher-check-messages.server";

export type LessonCheckPageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ pupil?: string }>;
};

export const LessonCheckPageContent = async ({ params, searchParams }: LessonCheckPageProps) => {
  await connection();
  const { lessonId } = await params;
  const { pupil: pupilParam } = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const isAdmin = actor.roles.includes(USER_ROLE.ADMIN);
  const locale = await getUiLocale();
  const data = await loadSequentialCheckPage(await getPrisma(), actor.userId, lessonId, isAdmin);
  const [teacherDict, commonDict] = await Promise.all([
    getDictionary(locale, "teacher"),
    getDictionary(locale, "common"),
  ]);
  const messages = pickTeacherCheckMessages(teacherDict, commonDict);
  const dictionaries = { teacher: teacherDict, common: commonDict };

  if (data.kind === "not_found") {
    notFound();
  }

  return (
    <CheckScreen
      data={data}
      initialPupilId={pupilParam ?? null}
      messages={messages}
      dictionaries={dictionaries}
    />
  );
};

