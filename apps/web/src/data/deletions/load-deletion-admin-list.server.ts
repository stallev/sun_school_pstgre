import "server-only";

import {
  DELETION_PLAN_ACTION,
  DELETION_PLAN_WARNING,
  DELETION_REQUEST_STATUS,
  DELETION_REQUEST_TYPE,
  USER_ROLE,
  type DeletionPlan,
  type DeletionRequestStatus,
  type UserRole,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { formatAppUserDisplayName, formatDisplayName } from "@/lib/person/format-display-name";
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
  requestedByRoleLabel: string | null;
  requestedByEmail: string | null;
  requestedByUsedNameFallback: boolean;
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

export type DeletionAdminListLabels = {
  deletedUserTemplate: string;
  requesterNameFallback: string;
  roleAdmin: string;
  roleTeacher: string;
  roleParent: string;
};

const pickRequesterRoleLabel = (
  roles: readonly { role: UserRole }[],
  labels: Pick<DeletionAdminListLabels, "roleAdmin" | "roleTeacher" | "roleParent">,
): string | null => {
  if (roles.some((entry) => entry.role === USER_ROLE.ADMIN)) return labels.roleAdmin;
  if (roles.some((entry) => entry.role === USER_ROLE.TEACHER)) return labels.roleTeacher;
  if (roles.some((entry) => entry.role === USER_ROLE.PARENT)) return labels.roleParent;
  return null;
};

export const resolveDeletionRequesterRoleLabel = (
  requestedById: string,
  subjectUserId: string | null,
  roles: readonly { role: UserRole }[],
  labels: Pick<DeletionAdminListLabels, "roleAdmin" | "roleTeacher" | "roleParent">,
): string | null => {
  if (subjectUserId !== null && requestedById === subjectUserId) {
    return null;
  }
  return pickRequesterRoleLabel(roles, labels);
};

export const isDeletionRequestedBySubject = (
  requestedById: string,
  subjectUserId: string | null,
): boolean => subjectUserId !== null && requestedById === subjectUserId;

export const resolveDeletionRequesterDisplayName = (
  user: Parameters<typeof formatAppUserDisplayName>[0],
  labels: Pick<DeletionAdminListLabels, "deletedUserTemplate" | "requesterNameFallback">,
): { displayName: string; usedFallback: boolean } => {
  const formatted = formatAppUserDisplayName(user, labels.deletedUserTemplate).trim();
  if (formatted.length > 0) return { displayName: formatted, usedFallback: false };
  return { displayName: labels.requesterNameFallback, usedFallback: true };
};

export const sortDeletionRowsByDue = (rows: DeletionAdminRow[]): DeletionAdminRow[] =>
  [...rows].sort((left, right) => {
    if (left.dueOnIso !== right.dueOnIso) {
      return left.dueOnIso.localeCompare(right.dueOnIso);
    }
    return left.requestedAtIso.localeCompare(right.requestedAtIso);
  });

const diffCalendarDays = (dueIso: string, todayIso: string): number => {
  const due = calendarDateFromIso(dueIso).getTime();
  const today = calendarDateFromIso(todayIso).getTime();
  return Math.round((due - today) / MS_PER_DAY);
};

export async function loadDeletionAdminList(
  db: PrismaClient,
  actorUserId: string,
  tab: DeletionListTab,
  labels: DeletionAdminListLabels,
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
        select: {
          lastName: true,
          firstName: true,
          middleName: true,
          deletedOrdinal: true,
          status: true,
          roles: { select: { role: true } },
          identities: { select: { email: true }, orderBy: { createdAt: "asc" }, take: 1 },
        },
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

    const requesterName = resolveDeletionRequesterDisplayName(row.requestedBy, labels);

    mapped.push({
      requestId: row.id,
      type: row.type,
      status: row.status,
      subjectDisplayName,
      subjectUserId: row.subjectUserId,
      subjectPupilId: row.subjectPupilId,
      requestedAtIso: row.requestedAt.toISOString(),
      requestedByUserId: row.requestedById,
      requestedByDisplayName: requesterName.displayName,
      requestedByRoleLabel: resolveDeletionRequesterRoleLabel(
        row.requestedById,
        row.subjectUserId,
        row.requestedBy.roles,
        labels,
      ),
      requestedByEmail: row.requestedBy.identities[0]?.email?.trim() || null,
      requestedByUsedNameFallback: requesterName.usedFallback,
      requestedBySelf: isDeletionRequestedBySubject(row.requestedById, row.subjectUserId),
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

  return sortDeletionRowsByDue(mapped);
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
