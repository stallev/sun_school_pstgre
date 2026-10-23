import { loadManualAwardForm } from "@/data/achievements/load-manual-award-form.server";
import { loadPupilAchievementPanel } from "@/data/achievements/load-pupil-achievement-panel.server";
import { loadPupilPenaltyForm } from "@/data/achievements/load-pupil-penalty-form.server";
import { PupilAchievementPanelContent } from "@/components/achievements/PupilAchievementPanelContent.client";
import { getPrisma } from "@/lib/db.server";
import { getSchoolTimezone } from "@/lib/i18n/get-school-timezone.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickTeacherAchievementsMessages } from "@/lib/messages/pick-teacher-achievements-messages.server";
import { formatDisplayName } from "@/lib/person/format-display-name";

type PupilAchievementPanelProps = {
  actorUserId: string;
  pupilId: string;
  pupilName?: string;
  gradeId: string;
  academicYearId: string;
  yearClosed: boolean;
};

export const PupilAchievementPanel = async ({
  actorUserId,
  pupilId,
  pupilName,
  gradeId,
  academicYearId,
  yearClosed,
}: PupilAchievementPanelProps) => {
  const locale = await getUiLocale();
  const timeZone = await getSchoolTimezone();
  const prisma = await getPrisma();
  const panel = await loadPupilAchievementPanel(
    prisma,
    actorUserId,
    pupilId,
    gradeId,
    academicYearId,
    locale,
    timeZone,
    yearClosed,
  );
  if (panel.kind === "hidden") return null;

  const teacherDict = await getDictionary(locale, "teacher");
  const commonDict = await getDictionary(locale, "common");
  const messages = pickTeacherAchievementsMessages(teacherDict);
  const formError = getMessage(commonDict, "errors.form");

  const [manualAwardForm, penaltyForm, pupilRow] = await Promise.all([
    loadManualAwardForm(prisma, gradeId, academicYearId, locale, messages),
    loadPupilPenaltyForm(prisma, gradeId, academicYearId, locale, timeZone),
    pupilName
      ? null
      : prisma.pupil.findUnique({
          where: { id: pupilId },
          select: { lastName: true, firstName: true, middleName: true },
        }),
  ]);

  const displayName =
    pupilName ?? (pupilRow ? formatDisplayName(pupilRow) : "");

  return (
    <PupilAchievementPanelContent
      pupilId={pupilId}
      pupilName={displayName}
      gradeId={gradeId}
      academicYearId={academicYearId}
      canMutate={panel.canMutate}
      awards={panel.awards}
      penalties={panel.penalties}
      manualAwardForm={manualAwardForm}
      penaltyForm={penaltyForm}
      messages={messages}
      dictionaries={{ teacher: teacherDict, common: commonDict }}
      formError={formError}
    />
  );
};
