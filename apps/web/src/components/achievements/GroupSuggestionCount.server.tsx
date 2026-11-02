import { ACHIEVEMENT_SUGGESTION_STATUS } from "@sunschool/domain";
import { ContentText } from "@/components/atoms/ContentText";
import { CountBadge } from "@/components/ui/count-badge";
import { loadGradeAchievementUi } from "@/data/achievements/load-grade-achievement-ui.server";
import { getPrisma } from "@/lib/db.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

type GroupSuggestionCountProps = {
  gradeId: string;
  academicYearId: string;
};

/** "Awaiting confirmation: N" counter on the group card (teacher and admin); hidden when N = 0. */
export const GroupSuggestionCount = async ({ gradeId, academicYearId }: GroupSuggestionCountProps) => {
  const locale = await getUiLocale();
  const prisma = await getPrisma();
  const ui = await loadGradeAchievementUi(prisma, gradeId, academicYearId, locale, await getSchoolTimezone());
  if (!ui) return null;

  const count = await prisma.achievementSuggestion.count({
    where: { gradeId, academicYearId, status: ACHIEVEMENT_SUGGESTION_STATUS.SUGGESTED },
  });
  if (count === 0) return null;

  const teacherDict = await getDictionary(locale, "teacher");
  return (
    <ContentText className="flex items-center gap-2 text-sm text-ink-2">
      {getMessage(teacherDict, "achievements.suggestion.count_label")}
      <CountBadge>{count}</CountBadge>
    </ContentText>
  );
};
