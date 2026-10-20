/**
 * Inserts the people, queues and calendar of the dev fixture.
 * Admin and `teacher@example.com` are not created here.
 */
import {
  ACCESS_REQUEST_STATUS,
  CONSENT_TYPE,
  DELETION_REQUEST_STATUS,
  GRADE_EVENT_TYPE,
  USER_ROLE,
  computeDueOn,
} from "@sunschool/domain";
import type { SeedTx } from "../reference/types";
import { deterministicUuid, fixtureLessonName } from "./fixture";
import type { PeopleFixture } from "./people";

const SCHOOL_TIMEZONE_KEY = "school_timezone";
const DECIDED_AT = new Date("2026-09-15T10:00:00Z");

const id = (name: string): string => deterministicUuid(name);
const date = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

export type FixturePeopleContext = {
  organizationId: string;
  consentVersion: string;
  /** Admin when one exists, otherwise the dev teacher. Decides requests and files deletions. */
  actorUserId: string;
};

export async function writeFixtureUsers(tx: SeedTx, people: PeopleFixture, ctx: FixturePeopleContext): Promise<void> {
  const now = new Date("2026-08-20T10:00:00Z");
  await tx.appUser.createMany({
    data: people.users.map((user) => ({
      id: id(`user:${user.key}`),
      organizationId: ctx.organizationId,
      status: user.status,
      email: user.email,
      lastName: user.lastName,
      firstName: user.firstName,
      firstLoginAt: user.role === USER_ROLE.TEACHER ? now : null,
    })),
  });
  await tx.userRoleAssignment.createMany({
    data: people.users.flatMap((user) =>
      user.role ? [{ userId: id(`user:${user.key}`), role: user.role }] : [],
    ),
  });
  await tx.privacyConsent.createMany({
    data: people.users.flatMap((user) =>
      user.hasConsent
        ? [{
            id: id(`consent:${user.key}`),
            userId: id(`user:${user.key}`),
            textVersion: ctx.consentVersion,
            acceptedAt: now,
            type: CONSENT_TYPE.PD_PROCESSING,
          }]
        : [],
    ),
  });
  await tx.accessRequest.createMany({
    data: people.accessRequests.map((request) => {
      const user = people.users.find((row) => row.key === request.userKey)!;
      const decided = request.status !== ACCESS_REQUEST_STATUS.PENDING;
      return {
        id: id(`access:${request.userKey}`),
        userId: id(`user:${request.userKey}`),
        consentId: id(`consent:${request.userKey}`),
        fullNameSnapshot: `${user.lastName} ${user.firstName}`,
        status: request.status,
        decidedById: decided ? ctx.actorUserId : null,
        decidedAt: decided ? DECIDED_AT : null,
        rejectReason: request.rejectReason,
      };
    }),
  });
}

export async function writeFixtureEvents(tx: SeedTx, people: PeopleFixture): Promise<void> {
  await tx.gradeEvent.createMany({
    data: people.events.map((event) => ({
      id: id(`event:${event.key}`),
      gradeId: id(`grade:${event.gradeKey}`),
      eventDate: date(event.date),
      type: event.type,
      title: event.title,
      lessonId:
        event.type === GRADE_EVENT_TYPE.LESSON && event.lessonIndex !== null
          ? id(`lesson:${fixtureLessonName({ gradeKey: event.gradeKey, yearKey: event.yearKey, index: event.lessonIndex })}`)
          : null,
    })),
  });
}

export async function writeFixtureDeletions(tx: SeedTx, people: PeopleFixture, actorUserId: string): Promise<void> {
  const setting = await tx.appSetting.findUnique({ where: { key: SCHOOL_TIMEZONE_KEY } });
  const timeZone = typeof setting?.value === "string" && setting.value.length > 0 ? setting.value : "UTC";
  await tx.deletionRequest.createMany({
    data: people.deletions.map((request) => {
      const requestedAt = new Date(`${request.requestedOn}T12:00:00Z`);
      const resolved = request.status === DELETION_REQUEST_STATUS.CANCELLED || request.status === DELETION_REQUEST_STATUS.REJECTED;
      const taken = request.status === DELETION_REQUEST_STATUS.IN_PROGRESS || request.status === DELETION_REQUEST_STATUS.REJECTED;
      return {
        id: id(`deletion:${request.key}`),
        type: request.type,
        subjectUserId: request.subjectUserKey ? id(`user:${request.subjectUserKey}`) : null,
        subjectPupilId: request.subjectPupilKey ? id(`pupil:${request.subjectPupilKey}`) : null,
        requestedById: actorUserId,
        requestedAt,
        reason: request.reason,
        status: request.status,
        dueOn: date(computeDueOn(requestedAt, timeZone)),
        takenById: taken ? actorUserId : null,
        resolvedById: resolved ? actorUserId : null,
        resolvedAt: resolved ? DECIDED_AT : null,
        rejectReason: request.rejectReason,
      };
    }),
  });
}
