import "server-only";

import {
  ACADEMIC_YEAR_STATUS,
  type WeeklyDigestPayload,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { getDefaultOrganizationId } from "../access/get-organization-id.server";
import { getPupilAnalytics } from "../analytics/get-pupil-analytics";
import { buildPupilAnalyticsView } from "../analytics/pupil-analytics-present.server";
import { loadBricksBalanceInTransaction } from "../bricks/bricks-shared.server";
import { loadPupilAchievementPanel } from "../achievements/load-pupil-achievement-panel.server";
import { readFeaturesAchievementsEnabled } from "../achievements/achievement-feature.server";
import { ensureWeeklyDigest } from "./ensure-weekly-digest";
import {
  assertParentCanViewChildData,
  loadParentChildOptions,
  resolveParentSelectedPupilId,
  type ParentChildOption,
} from "./parent-child-access.server";
import { readFeaturesParentsEnabled } from "./family-feature.server";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

export type ParentDigestView = {
  payload: WeeklyDigestPayload;
  awardCount: number;
  penaltyCount: number;
  lateCount: number;
};

export type ParentChildPageData =
  | { kind: "flag_off" }
  | { kind: "not_found" }
  | { kind: "no_children" }
  | { kind: "no_consent"; children: ParentChildOption[]; pupilId: string }
  | {
      kind: "page";
      children: ParentChildOption[];
      pupilId: string;
      pupilName: string;
      gradeId: string;
      yearId: string;
      yearName: string;
      achievementsEnabled: boolean;
      digest: ParentDigestView | null;
      bricks: { earned: number; issued: number; pending: number };
      analyticsView: ReturnType<typeof buildPupilAnalyticsView> | null;
      achievementPanel: Awaited<ReturnType<typeof loadPupilAchievementPanel>>;
    };

export async function loadParentChildPage(
  db: PrismaClient,
  actorUserId: string,
  preferredPupilId: string | null,
  locale: MessageLocale,
  timeZone: string,
  attendanceCheckedTemplate: string,
): Promise<ParentChildPageData> {
  const flagOn = await db.$transaction((tx) => readFeaturesParentsEnabled(tx));
  if (!flagOn) return { kind: "flag_off" };

  const organizationId = await getDefaultOrganizationId(db);
  const children = await db.$transaction((tx) =>
    loadParentChildOptions(tx, actorUserId, organizationId),
  );
  if (children.length === 0) return { kind: "no_children" };

  const consented = children.filter((row) => row.hasElectronicConsent);
  const fallbackPupilId = consented[0]?.pupilId ?? children[0]!.pupilId;
  const pupilId = resolveParentSelectedPupilId(children, preferredPupilId, fallbackPupilId);
  if (!pupilId) return { kind: "not_found" };

  const access = await db.$transaction((tx) => assertParentCanViewChildData(tx, actorUserId, pupilId));
  if (isMutationErr(access)) {
    return { kind: "no_consent", children, pupilId };
  }

  const year = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true, name: true, startsOn: true, endsOn: true },
  });
  if (!year) return { kind: "no_children" };

  const enrollment = await db.enrollment.findFirst({
    where: { pupilId, academicYearId: year.id },
    select: {
      gradeId: true,
      pupil: {
        select: { lastName: true, firstName: true, middleName: true },
      },
      grade: { select: { name: true } },
    },
    orderBy: { startsOn: "desc" },
  });
  if (!enrollment) return { kind: "no_children" };

  const pupilName = [enrollment.pupil.lastName, enrollment.pupil.firstName, enrollment.pupil.middleName]
    .filter(Boolean)
    .join(" ");

  const digestResult = await ensureWeeklyDigest(db, actorUserId);
  const digestPayload = digestResult.ok ? digestResult.data.payload : null;

  const periodFilter = {
    academicYearId: year.id,
    fromIso: year.startsOn.toISOString().slice(0, 10),
    toIso: year.endsOn.toISOString().slice(0, 10),
  };

  const analyticsResult = await getPupilAnalytics(
    db,
    actorUserId,
    pupilId,
    enrollment.gradeId,
    periodFilter,
  );
  const analyticsView =
    analyticsResult.ok
      ? buildPupilAnalyticsView(analyticsResult.data, attendanceCheckedTemplate)
      : null;

  const bricks = await db.$transaction((tx) =>
    loadBricksBalanceInTransaction(tx, pupilId, year.id),
  );

  const achievementsEnabled = await db.$transaction((tx) => readFeaturesAchievementsEnabled(tx));
  const achievementPanel = await loadPupilAchievementPanel(
    db,
    actorUserId,
    pupilId,
    enrollment.gradeId,
    year.id,
    locale,
    timeZone,
    false,
  );

  const digest: ParentDigestView | null = digestPayload
    ? {
        payload: digestPayload,
        awardCount: digestPayload.awardIds.length,
        penaltyCount: digestPayload.penaltyIds.length,
        lateCount: digestPayload.lateCheckIds.length,
      }
    : null;

  return {
    kind: "page",
    children,
    pupilId,
    pupilName,
    gradeId: enrollment.gradeId,
    yearId: year.id,
    yearName: year.name,
    achievementsEnabled,
    digest,
    bricks: {
      earned: bricks.earned,
      issued: bricks.issued,
      pending: Math.max(0, bricks.balance),
    },
    analyticsView,
    achievementPanel,
  };
}
