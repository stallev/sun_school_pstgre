import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import { CustomLink } from "@/components/ui/custom-link";
import { Button } from "@/components/ui/button";
import { AchievementTierDot } from "@/components/achievements/AchievementTierDot";
import { TodayManualAwardTrigger } from "@/components/achievements/TodayManualAwardTrigger.client";
import { loadManualAwardForm } from "@/data/achievements/load-manual-award-form.server";
import { loadTodayAchievementMark } from "@/data/achievements/load-today-achievement-mark.server";
import { getPrisma } from "@/lib/db.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickTeacherAchievementsMessages } from "@/lib/messages/pick-teacher-achievements-messages.server";
import { formatTierLabel } from "@/lib/achievements/format-tier-label";

type TodayAchievementMarkSectionProps = {
  gradeId: string;
  academicYearId: string;
};

export const TodayAchievementMarkSection = async ({
  gradeId,
  academicYearId,
}: TodayAchievementMarkSectionProps) => {
  const locale = await getUiLocale();
  const timeZone = await getSchoolTimezone();
  const data = await loadTodayAchievementMark(
    await getPrisma(),
    gradeId,
    academicYearId,
    locale,
    timeZone,
  );
  if (data.kind === "hidden") return null;

  const prisma = await getPrisma();
  const teacherDict = await getDictionary(locale, "teacher");
  const commonDict = await getDictionary(locale, "common");
  const messages = pickTeacherAchievementsMessages(teacherDict);
  const manualAwardForm =
    data.kind === "ready"
      ? await loadManualAwardForm(prisma, data.gradeId, data.academicYearId, locale, messages)
      : null;

  if (data.kind === "mode_off") {
    return (
      <Card className="p-4 sm:p-5">
        <SectionTitle>{messages.todayMarkTitle}</SectionTitle>
        <ContentText className="mt-2 text-ink-2">{messages.todayMarkOffText}</ContentText>
        <Button variant="outline" className="mt-3 min-h-11" render={<CustomLink href="/group" />}>
          {messages.todayMarkGroupSettings}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle>{messages.todayMarkTitle}</SectionTitle>
      <ContentText className="mt-1 text-sm text-ink-2">{messages.todayMarkHint}</ContentText>
      {data.rows.length > 0 ? (
        <ul className="mt-4 divide-y divide-line">
          {data.rows.map((row) => (
            <li key={row.awardId} className="flex items-center gap-3 py-3">
              <AchievementTierDot tierIndex={row.tier - 1} className="mt-1.5" />
              <div className="min-w-0 flex-1">
                <ContentText className="truncate font-medium">{row.pupilName}</ContentText>
                <ContentText className="truncate text-sm text-ink-2">
                  {row.achievementName} · {formatTierLabel(row.tier, messages)} · +{row.points}
                </ContentText>
              </div>
              {row.isManual ? (
                <ContentText className="text-xs text-muted">{messages.manualTag}</ContentText>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <TodayManualAwardTrigger
        gradeId={data.gradeId}
        academicYearId={data.academicYearId}
        formData={manualAwardForm!}
        messages={messages}
        dictionaries={{ teacher: teacherDict, common: commonDict }}
        formError={getMessage(commonDict, "errors.form")}
      />
    </Card>
  );
};
