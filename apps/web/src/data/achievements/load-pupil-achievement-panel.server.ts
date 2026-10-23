import "server-only";

import {
  AWARD_SOURCE,
  PENALTY_STATUS,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { userHasAdminRole } from "@/data/access/access-admin-guards.server";
import { formatLessonDisplayDate } from "@/lib/lesson/format-lesson-display-date";
import { loadGradeAchievementUi } from "./load-grade-achievement-ui.server";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

import type { PupilAwardRow, PupilPenaltyRow } from "@/lib/achievements/pupil-achievement-panel-types";

export type { PupilAwardRow, PupilPenaltyRow } from "@/lib/achievements/pupil-achievement-panel-types";

export type PupilAchievementPanelData =
  | { kind: "hidden" }
  | {
      kind: "panel";
      modeOn: boolean;
      canMutate: boolean;
      isAdmin: boolean;
      awards: PupilAwardRow[];
      penalties: PupilPenaltyRow[];
    };

export async function loadPupilAchievementPanel(
  db: PrismaClient,
  actorUserId: string,
  pupilId: string,
  gradeId: string | null,
  academicYearId: string,
  locale: MessageLocale,
  timeZone: string,
  yearClosed: boolean,
): Promise<PupilAchievementPanelData> {
  if (!gradeId) return { kind: "hidden" };
  const ui = await loadGradeAchievementUi(db, gradeId, academicYearId, locale, timeZone);
  if (!ui) return { kind: "hidden" };

  const isAdmin = await userHasAdminRole(db, actorUserId);
  const canMutate = ui.achievementsEnabled && (!yearClosed || isAdmin);

  const [awards, penalties] = await Promise.all([
    db.achievementAward.findMany({
      where: { pupilId, academicYearId },
      orderBy: { awardedAt: "desc" },
      select: {
        id: true,
        tier: true,
        points: true,
        source: true,
        reason: true,
        revokedAt: true,
        achievement: { select: { nameRu: true, nameEn: true } },
        evidence: {
          select: {
            check: {
              select: {
                lesson: { select: { ordinal: true, lessonDate: true } },
              },
            },
          },
        },
      },
    }),
    db.penalty.findMany({
      where: { pupilId, lesson: { academicYearId } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        points: true,
        status: true,
        achievement: { select: { nameRu: true } },
        lesson: { select: { academicYear: { select: { status: true } } } },
      },
    }),
  ]);

  const awardRows: PupilAwardRow[] = awards.map((row) => {
    const name = locale === "en" ? row.achievement.nameEn : row.achievement.nameRu;
    const evidenceLabels = row.evidence.map((evidence) => {
      const lesson = evidence.check.lesson;
      const dateLabel = formatLessonDisplayDate(lesson.lessonDate.toISOString().slice(0, 10), {
        locale,
        timeZone,
      });
      return locale === "en"
        ? `Lesson ${lesson.ordinal} · ${dateLabel}`
        : `урок ${lesson.ordinal} · ${dateLabel}`;
    });
    return {
      awardId: row.id,
      name,
      tier: row.tier,
      points: row.points,
      isManual: row.source === AWARD_SOURCE.MANUAL,
      isRevoked: row.revokedAt !== null,
      canRevoke: isAdmin && row.revokedAt === null,
      evidenceLabels,
      reason: row.reason,
    };
  });

  const penaltyRows: PupilPenaltyRow[] = penalties.map((row) => ({
    penaltyId: row.id,
    name: row.achievement.nameRu,
    points: row.points,
    status: row.status,
    canCancel:
      row.status === PENALTY_STATUS.ACTIVE &&
      (isAdmin || !yearClosed),
  }));

  return {
    kind: "panel",
    modeOn: ui.achievementsEnabled,
    canMutate,
    isAdmin,
    awards: awardRows,
    penalties: penaltyRows,
  };
}
