import { describe, expect, it } from "vitest";
import { DELETION_REQUEST_TYPE } from "../constants/enums";
import {
  buildDeletionPlan,
  sumDeletionPlanByAction,
  type AccountDeletionPlanInput,
  type ChildDeletionPlanInput,
} from "./build-plan";
import {
  DELETION_DATA_CATEGORY,
  DELETION_PLAN_ACTION,
  DELETION_PLAN_WARNING,
} from "./constants";

const accountCounts: AccountDeletionPlanInput = {
  loginIdentityCount: 2,
  userRoleCount: 1,
  teacherAssignmentCount: 3,
  privacyConsentCount: 1,
  accessRequestCount: 0,
  auditLogUserTextCount: 4,
  assignedToActiveYearGroup: true,
  lessonsWithIncompleteChecks: 2,
};

const childCounts: ChildDeletionPlanInput = {
  enrollmentCount: 2,
  childDataConsentCount: 1,
  homeworkCheckCount: 5,
  homeworkVerseScoreCount: 10,
  homeworkScoreEventCount: 3,
  brickLedgerCount: 7,
  auditLogChildCount: 6,
  achievementAwardCount: 0,
  penaltyCount: 0,
  recitationAttemptCount: 0,
};

describe("buildDeletionPlan (deletion_requests §6)", () => {
  it("groups account subject rows into delete and anonymize categories", () => {
    const plan = buildDeletionPlan({ type: DELETION_REQUEST_TYPE.ACCOUNT, counts: accountCounts });
    expect(sumDeletionPlanByAction(plan, DELETION_PLAN_ACTION.DELETE)).toBe(6);
    expect(sumDeletionPlanByAction(plan, DELETION_PLAN_ACTION.ANONYMIZE)).toBe(6);
    expect(plan.items.find((item) => item.category === DELETION_DATA_CATEGORY.APP_USER)?.action).toBe(
      DELETION_PLAN_ACTION.ANONYMIZE,
    );
    expect(
      plan.items.find((item) => item.category === DELETION_DATA_CATEGORY.DELETION_REQUEST)?.action,
    ).toBe(DELETION_PLAN_ACTION.KEEP);
  });

  it("includes account plan warnings from §7", () => {
    const plan = buildDeletionPlan({ type: DELETION_REQUEST_TYPE.ACCOUNT, counts: accountCounts });
    expect(plan.warnings).toEqual([
      DELETION_PLAN_WARNING.TEACHER_ASSIGNED_ACTIVE_YEAR,
      DELETION_PLAN_WARNING.INCOMPLETE_HOMEWORK_CHECKS,
    ]);
  });

  it("deletes child data categories and anonymizes audit rows", () => {
    const plan = buildDeletionPlan({ type: DELETION_REQUEST_TYPE.CHILD_DATA, counts: childCounts });
    expect(sumDeletionPlanByAction(plan, DELETION_PLAN_ACTION.DELETE)).toBe(29);
    expect(sumDeletionPlanByAction(plan, DELETION_PLAN_ACTION.ANONYMIZE)).toBe(6);
    expect(plan.items.find((item) => item.category === DELETION_DATA_CATEGORY.PUPIL)?.count).toBe(1);
    expect(plan.warnings).toEqual([]);
  });
});
