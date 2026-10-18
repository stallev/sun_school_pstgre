import { DELETION_REQUEST_TYPE } from "../constants/enums";
import {
  DELETION_DATA_CATEGORY,
  DELETION_PLAN_ACTION,
  DELETION_PLAN_WARNING,
  type DeletionDataCategory,
  type DeletionPlanAction,
  type DeletionPlanWarningCode,
} from "./constants";

export type DeletionPlanItem = {
  category: DeletionDataCategory;
  action: DeletionPlanAction;
  count: number;
};

export type DeletionPlan = {
  items: DeletionPlanItem[];
  warnings: DeletionPlanWarningCode[];
};

export type AccountDeletionPlanInput = {
  loginIdentityCount: number;
  userRoleCount: number;
  teacherAssignmentCount: number;
  privacyConsentCount: number;
  accessRequestCount: number;
  auditLogUserTextCount: number;
  assignedToActiveYearGroup: boolean;
  lessonsWithIncompleteChecks: number;
};

export type ChildDeletionPlanInput = {
  enrollmentCount: number;
  childDataConsentCount: number;
  homeworkCheckCount: number;
  homeworkVerseScoreCount: number;
  homeworkScoreEventCount: number;
  brickLedgerCount: number;
  auditLogChildCount: number;
  achievementAwardCount: number;
  penaltyCount: number;
  recitationAttemptCount: number;
};

const line = (
  category: DeletionDataCategory,
  action: DeletionPlanAction,
  count: number,
): DeletionPlanItem => ({ category, action, count });

const buildAccountPlan = (input: AccountDeletionPlanInput): DeletionPlan => {
  const warnings: DeletionPlanWarningCode[] = [];
  if (input.assignedToActiveYearGroup) {
    warnings.push(DELETION_PLAN_WARNING.TEACHER_ASSIGNED_ACTIVE_YEAR);
  }
  if (input.lessonsWithIncompleteChecks > 0) {
    warnings.push(DELETION_PLAN_WARNING.INCOMPLETE_HOMEWORK_CHECKS);
  }

  const items: DeletionPlanItem[] = [
    line(DELETION_DATA_CATEGORY.LOGIN_IDENTITY, DELETION_PLAN_ACTION.DELETE, input.loginIdentityCount),
    line(DELETION_DATA_CATEGORY.USER_ROLE, DELETION_PLAN_ACTION.DELETE, input.userRoleCount),
    line(
      DELETION_DATA_CATEGORY.TEACHER_ASSIGNMENT,
      DELETION_PLAN_ACTION.DELETE,
      input.teacherAssignmentCount,
    ),
    line(DELETION_DATA_CATEGORY.APP_USER, DELETION_PLAN_ACTION.ANONYMIZE, 1),
    line(
      DELETION_DATA_CATEGORY.PRIVACY_CONSENT,
      DELETION_PLAN_ACTION.ANONYMIZE,
      input.privacyConsentCount,
    ),
    line(
      DELETION_DATA_CATEGORY.ACCESS_REQUEST,
      DELETION_PLAN_ACTION.ANONYMIZE,
      input.accessRequestCount,
    ),
    line(
      DELETION_DATA_CATEGORY.AUDIT_LOG_USER_TEXT,
      DELETION_PLAN_ACTION.ANONYMIZE,
      input.auditLogUserTextCount,
    ),
    line(DELETION_DATA_CATEGORY.DELETION_REQUEST, DELETION_PLAN_ACTION.KEEP, 1),
  ];

  return { items, warnings };
};

const buildChildPlan = (input: ChildDeletionPlanInput): DeletionPlan => {
  const items: DeletionPlanItem[] = [
    line(DELETION_DATA_CATEGORY.PUPIL, DELETION_PLAN_ACTION.DELETE, 1),
    line(DELETION_DATA_CATEGORY.ENROLLMENT, DELETION_PLAN_ACTION.DELETE, input.enrollmentCount),
    line(
      DELETION_DATA_CATEGORY.CHILD_DATA_CONSENT,
      DELETION_PLAN_ACTION.DELETE,
      input.childDataConsentCount,
    ),
    line(DELETION_DATA_CATEGORY.HOMEWORK_CHECK, DELETION_PLAN_ACTION.DELETE, input.homeworkCheckCount),
    line(
      DELETION_DATA_CATEGORY.HOMEWORK_VERSE_SCORE,
      DELETION_PLAN_ACTION.DELETE,
      input.homeworkVerseScoreCount,
    ),
    line(
      DELETION_DATA_CATEGORY.HOMEWORK_SCORE_EVENT,
      DELETION_PLAN_ACTION.DELETE,
      input.homeworkScoreEventCount,
    ),
    line(DELETION_DATA_CATEGORY.BRICK_LEDGER, DELETION_PLAN_ACTION.DELETE, input.brickLedgerCount),
    line(
      DELETION_DATA_CATEGORY.ACHIEVEMENT_AWARD,
      DELETION_PLAN_ACTION.DELETE,
      input.achievementAwardCount,
    ),
    line(DELETION_DATA_CATEGORY.PENALTY, DELETION_PLAN_ACTION.DELETE, input.penaltyCount),
    line(
      DELETION_DATA_CATEGORY.RECITATION_ATTEMPT,
      DELETION_PLAN_ACTION.DELETE,
      input.recitationAttemptCount,
    ),
    line(
      DELETION_DATA_CATEGORY.AUDIT_LOG_CHILD,
      DELETION_PLAN_ACTION.ANONYMIZE,
      input.auditLogChildCount,
    ),
    line(DELETION_DATA_CATEGORY.DELETION_REQUEST, DELETION_PLAN_ACTION.KEEP, 1),
  ];

  return { items, warnings: [] };
};

export type BuildDeletionPlanInput =
  | { type: typeof DELETION_REQUEST_TYPE.ACCOUNT; counts: AccountDeletionPlanInput }
  | { type: typeof DELETION_REQUEST_TYPE.CHILD_DATA; counts: ChildDeletionPlanInput };

/** deletion_requests_contract §5.3, §6 — pure plan from subject counts at preview time. */
export const buildDeletionPlan = (input: BuildDeletionPlanInput): DeletionPlan => {
  if (input.type === DELETION_REQUEST_TYPE.ACCOUNT) {
    return buildAccountPlan(input.counts);
  }
  return buildChildPlan(input.counts);
};

export const sumDeletionPlanByAction = (
  plan: DeletionPlan,
  action: DeletionPlanAction,
): number =>
  plan.items.reduce((total, item) => (item.action === action ? total + item.count : total), 0);
