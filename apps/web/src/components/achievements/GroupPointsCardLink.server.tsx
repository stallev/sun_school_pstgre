import { loadGradeAchievementUi } from "@/data/achievements/load-grade-achievement-ui.server";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { getPrisma } from "@/lib/db.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

type GroupPointsCardLinkProps = {
  gradeId: string;
  academicYearId: string;
  href: string;
};

export const GroupPointsCardLink = async ({
  gradeId,
  academicYearId,
  href,
}: GroupPointsCardLinkProps) => {
  const locale = await getUiLocale();
  const timeZone = await getSchoolTimezone();
  const ui = await loadGradeAchievementUi(
    await getPrisma(),
    gradeId,
    academicYearId,
    locale,
    timeZone,
  );
  if (!ui) return null;

  const adminDict = await getDictionary(locale, "admin");
  const label = getMessage(adminDict, "achievements.group_points_card_link");

  return (
    <Button type="button" variant="outline" className="min-h-11" render={<CustomLink href={href} />}>
      {label}
    </Button>
  );
};
