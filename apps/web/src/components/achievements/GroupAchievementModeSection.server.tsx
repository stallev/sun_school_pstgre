import { loadGradeAchievementUi } from "@/data/achievements/load-grade-achievement-ui.server";
import { getPrisma } from "@/lib/db.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickTeacherAchievementsMessages } from "@/lib/messages/pick-teacher-achievements-messages.server";
import { GroupAchievementModeCard } from "@/components/achievements/GroupAchievementModeCard.client";

type GroupAchievementModeSectionProps = {
  gradeId: string;
  academicYearId: string;
  canMutate: boolean;
};

export const GroupAchievementModeSection = async ({
  gradeId,
  academicYearId,
  canMutate,
}: GroupAchievementModeSectionProps) => {
  const locale = await getUiLocale();
  const timeZone = await getSchoolTimezone();
  const ui = await loadGradeAchievementUi(await getPrisma(), gradeId, academicYearId, locale, timeZone);
  if (!ui) return null;

  const teacherDict = await getDictionary(locale, "teacher");
  const commonDict = await getDictionary(locale, "common");
  const messages = pickTeacherAchievementsMessages(teacherDict);

  return (
    <GroupAchievementModeCard
      gradeId={gradeId}
      academicYearId={academicYearId}
      achievementsEnabled={ui.achievementsEnabled}
      offPeriodLabel={ui.offPeriodLabel}
      canMutate={canMutate}
      messages={messages}
      dictionaries={{ teacher: teacherDict, common: commonDict }}
      formError={getMessage(commonDict, "errors.form")}
    />
  );
};
