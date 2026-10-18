import "server-only";

import {
  DELETION_PLAN_ACTION,
  DELETION_PLAN_WARNING,
  DELETION_REQUEST_STATUS,
  DELETION_REQUEST_TYPE,
  type DeletionPlan,
  type DeletionRequestStatus,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { calendarDateFromIso, isoFromCalendarDate } from "@/data/school/calendar-date";
import { isoTodayUtc } from "@/data/school/school-pupil-shared.server";
import { OPEN_DELETION_STATUSES } from "./deletion-shared.server";
import { previewDeletionPlan } from "./preview-plan";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DELETION_LIST_TAB = {
  OPEN: "open",
  DONE: "done",
  CLOSED: "closed",
} as const;

export type DeletionListTab = (typeof DELETION_LIST_TAB)[keyof typeof DELETION_LIST_TAB];

const OPEN_STATUSES = [...OPEN_DELETION_STATUSES];
const CLOSED_STATUSES = [DELETION_REQUEST_STATUS.REJECTED, DELETION_REQUEST_STATUS.CANCELLED];

export type DeletionAdminRow = {
  requestId: string;
  type: typeof DELETION_REQUEST_TYPE.ACCOUNT | typeof DELETION_REQUEST_TYPE.CHILD_DATA;
  status: DeletionRequestStatus;
  subjectDisplayName: string;
  subjectUserId: string | null;
  subjectPupilId: string | null;
  requestedAtIso: string;
  requestedByUserId: string;
  requestedByDisplayName: string;
  requestedBySelf: boolean;
  reason: string | null;
  dueOnIso: string;
  daysRemaining: number;
  isOverdue: boolean;
  takenByDisplayName: string | null;
  rejectReason: string | null;
  resolvedAtIso: string | null;
  resolvedByDisplayName: string | null;
  plan: DeletionPlan | null;
  executeBlocked: boolean;
};

export const parseDeletionListTab = (raw: string | undefined): DeletionListTab => {
  if (raw === DELETION_LIST_TAB.DONE || raw === DELETION_LIST_TAB.CLOSED) return raw;
  return DELETION_LIST_TAB.OPEN;
};

const statusFilterForTab = (tab: DeletionListTab): DeletionRequestStatus[] => {
  if (tab === DELETION_LIST_TAB.DONE) return [DELETION_REQUEST_STATUS.DONE];
  if (tab === DELETION_LIST_TAB.CLOSED) return CLOSED_STATUSES;
  return OPEN_STATUSES;
};

const diffCalendarDays = (dueIso: string, todayIso: string): number => {
  const due = calendarDateFromIso(dueIso).getTime();
  const today = calendarDateFromIso(todayIso).getTime();
  return Math.round((due - today) / MS_PER_DAY);
};

export async function loadDeletionAdminList(
  db: PrismaClient,
  actorUserId: string,
  tab: DeletionListTab,
): Promise<DeletionAdminRow[]> {
  const todayIso = isoTodayUtc();
  const statuses = statusFilterForTab(tab);

  const rows = await db.deletionRequest.findMany({
    where: { status: { in: statuses } },
    orderBy: [{ dueOn: "asc" }, { requestedAt: "asc" }],
    select: {
      id: true,
      type: true,
      status: true,
      requestedAt: true,
      reason: true,
      dueOn: true,
      rejectReason: true,
      resolvedAt: true,
      subjectUserId: true,
      subjectPupilId: true,
      requestedById: true,
      subjectUser: {
        select: { lastName: true, firstName: true, middleName: true, deletedOrdinal: true },
      },
      subjectPupil: {
        select: { lastName: true, firstName: true, middleName: true },
      },
      requestedBy: {
        select: { lastName: true, firstName: true, middleName: true, deletedOrdinal: true },
      },
      takenBy: {
        select: { lastName: true, firstName: true, middleName: true, deletedOrdinal: true },
      },
      resolvedBy: {
        select: { lastName: true, firstName: true, middleName: true, deletedOrdinal: true },
      },
    },
  });

  const mapped: DeletionAdminRow[] = [];

  for (const row of rows) {
    const subjectDisplayName =
      row.type === DELETION_REQUEST_TYPE.ACCOUNT && row.subjectUser
        ? formatDisplayName(row.subjectUser)
        : row.subjectPupil
          ? formatDisplayName(row.subjectPupil)
          : "—";

    const dueOnIso = isoFromCalendarDate(row.dueOn);
    const daysRemaining = diffCalendarDays(dueOnIso, todayIso);
    const isOpen = OPEN_STATUSES.includes(row.status);

    let plan: DeletionPlan | null = null;
    let executeBlocked = false;
    if (isOpen) {
      const preview = await previewDeletionPlan(db, actorUserId, { requestId: row.id });
      if (preview.ok) {
        plan = preview.data.plan;
        executeBlocked = plan.warnings.includes(DELETION_PLAN_WARNING.LAST_ADMIN);
      }
    }

    mapped.push({
      requestId: row.id,
      type: row.type,
      status: row.status,
      subjectDisplayName,
      subjectUserId: row.subjectUserId,
      subjectPupilId: row.subjectPupilId,
      requestedAtIso: row.requestedAt.toISOString(),
      requestedByUserId: row.requestedById,
      requestedByDisplayName: formatDisplayName(row.requestedBy),
      requestedBySelf: row.requestedById === row.subjectUserId,
      reason: row.reason,
      dueOnIso,
      daysRemaining,
      isOverdue: isOpen && daysRemaining < 0,
      takenByDisplayName: row.takenBy ? formatDisplayName(row.takenBy) : null,
      rejectReason: row.rejectReason,
      resolvedAtIso: row.resolvedAt?.toISOString() ?? null,
      resolvedByDisplayName: row.resolvedBy ? formatDisplayName(row.resolvedBy) : null,
      plan,
      executeBlocked,
    });
  }

  return mapped;
}

export const countDeletionPlanTotals = (plan: DeletionPlan | null): { deleteCount: number; anonymizeCount: number } => {
  if (!plan) return { deleteCount: 0, anonymizeCount: 0 };
  let deleteCount = 0;
  let anonymizeCount = 0;
  for (const item of plan.items) {
    if (item.count <= 0) continue;
    if (item.action === DELETION_PLAN_ACTION.DELETE) deleteCount += item.count;
    if (item.action === DELETION_PLAN_ACTION.ANONYMIZE) anonymizeCount += item.count;
  }
  return { deleteCount, anonymizeCount };
};
