import "server-only";
import { CONSENT_STATUS, countCalendarDaysBetween } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { isoTodayUtc } from "./school-pupil-shared.server";

export const LEGACY_CONSENT_DEADLINE_KEY = "legacy_consent_deadline_on";

export const suggestNextLegacyDeadlineOn = (deadlineOn: string): string => {
  const date = new Date(`${deadlineOn}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

export type LegacyPendingRow = {
  pupilId: string;
  displayName: string;
  daysRemaining: number;
  isOverdue: boolean;
};

export type LegacyConsentDeadlineSummary = {
  deadlineOn: string | null;
  pendingCount: number;
  daysRemaining: number | null;
  isOverdue: boolean;
};

export async function readLegacyConsentDeadlineOn(db: PrismaClient): Promise<string | null> {
  const row = await db.appSetting.findUnique({
    where: { key: LEGACY_CONSENT_DEADLINE_KEY },
    select: { value: true },
  });
  return row?.value && typeof row.value === "string" ? row.value : null;
};

export async function listLegacyPendingPupils(db: PrismaClient): Promise<{
  deadlineOn: string | null;
  rows: LegacyPendingRow[];
}> {
  const organizationId = await getDefaultOrganizationId(db);
  const todayIso = isoTodayUtc();
  const deadlineOn = await readLegacyConsentDeadlineOn(db);

  const pupils = await db.pupil.findMany({
    where: {
      organizationId,
      consents: { some: { status: CONSENT_STATUS.LEGACY_PENDING } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      lastName: true,
      firstName: true,
      middleName: true,
    },
  });

  const rows: LegacyPendingRow[] = pupils.map((pupil) => {
    const daysRemaining =
      deadlineOn !== null ? countCalendarDaysBetween(todayIso, deadlineOn) : 0;
    const isOverdue = deadlineOn !== null ? todayIso > deadlineOn : false;
    return {
      pupilId: pupil.id,
      displayName: formatDisplayName(pupil),
      daysRemaining,
      isOverdue,
    };
  });

  return { deadlineOn, rows };
}

export async function loadLegacyConsentDeadlineSummary(
  db: PrismaClient,
): Promise<LegacyConsentDeadlineSummary> {
  const todayIso = isoTodayUtc();
  const { deadlineOn, rows } = await listLegacyPendingPupils(db);
  const daysRemaining =
    deadlineOn !== null ? countCalendarDaysBetween(todayIso, deadlineOn) : null;
  const isOverdue = deadlineOn !== null ? todayIso > deadlineOn : false;
  return {
    deadlineOn,
    pendingCount: rows.length,
    daysRemaining,
    isOverdue,
  };
}
