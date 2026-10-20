/**
 * People, queues and calendar of the dev fixture (seed_data_spec §8).
 * Fictional only: emails are `@example.test`, nobody here can sign in.
 * The real admin and `teacher@example.com` are not in this list.
 */
import {
  ACCESS_REQUEST_STATUS,
  ACCOUNT_STATUS,
  ACADEMIC_YEAR_STATUS,
  DELETION_REQUEST_STATUS,
  DELETION_REQUEST_TYPE,
  GRADE_EVENT_TYPE,
  USER_ROLE,
  type AccessRequestStatus,
  type AccountStatus,
  type DeletionRequestStatus,
  type DeletionRequestType,
  type GradeEventType,
  type UserRole,
} from "@sunschool/domain";
import { GRADE_KEY, type Fixture, type GradeKey, type YearKey } from "./fixture";

export const FIXTURE_USER_KEY = {
  TEACHER_JUNIOR: "teacher-junior",
  TEACHER_MIDDLE: "teacher-middle",
  REGISTRATION: "registration",
  PENDING: "pending",
  REJECTED: "rejected",
  DISABLED: "disabled",
  DUPLICATE_ACTIVE: "duplicate-active",
  DUPLICATE_PENDING: "duplicate-pending",
} as const;

export type FixtureUser = {
  key: string;
  email: string;
  lastName: string;
  firstName: string;
  status: AccountStatus;
  role: UserRole | null;
  /** Privacy consent row. Access requests require one. */
  hasConsent: boolean;
};

export type FixtureAccessRequest = {
  userKey: string;
  status: AccessRequestStatus;
  rejectReason: string | null;
};

export type FixtureDeletion = {
  key: string;
  type: DeletionRequestType;
  status: DeletionRequestStatus;
  subjectUserKey: string | null;
  subjectPupilKey: string | null;
  reason: string | null;
  rejectReason: string | null;
  requestedOn: string;
};

export type FixtureEvent = {
  key: string;
  gradeKey: GradeKey;
  yearKey: YearKey;
  date: string;
  type: GradeEventType;
  title: string;
  /** Set for `LESSON` events; the writer links `lesson_id`. */
  lessonIndex: number | null;
};

export type PeopleFixture = {
  users: FixtureUser[];
  accessRequests: FixtureAccessRequest[];
  deletions: FixtureDeletion[];
  events: FixtureEvent[];
};

const REJECT_PARENTS = "Нет согласия родителей на обработку данных";

function user(
  key: string,
  lastName: string,
  firstName: string,
  status: AccountStatus,
  role: UserRole | null,
  hasConsent: boolean,
): FixtureUser {
  return { key, email: `${key}@example.test`, lastName, firstName, status, role, hasConsent };
}

export function buildPeopleFixture(fixture: Fixture): PeopleFixture {
  const users: FixtureUser[] = [
    user(FIXTURE_USER_KEY.TEACHER_JUNIOR, "Фикстура", "Учитель Младшей", ACCOUNT_STATUS.ACTIVE, USER_ROLE.TEACHER, true),
    user(FIXTURE_USER_KEY.TEACHER_MIDDLE, "Фикстура", "Учитель Средней", ACCOUNT_STATUS.ACTIVE, USER_ROLE.TEACHER, true),
    user(FIXTURE_USER_KEY.REGISTRATION, "Соколов", "Пётр", ACCOUNT_STATUS.REGISTRATION, null, false),
    user(FIXTURE_USER_KEY.PENDING, "Орлова", "Нина", ACCOUNT_STATUS.REQUEST_PENDING, null, true),
    user(FIXTURE_USER_KEY.REJECTED, "Белов", "Игорь", ACCOUNT_STATUS.REJECTED, null, true),
    user(FIXTURE_USER_KEY.DISABLED, "Кузнецов", "Олег", ACCOUNT_STATUS.DISABLED, USER_ROLE.TEACHER, true),
    user(FIXTURE_USER_KEY.DUPLICATE_ACTIVE, "Морозов", "Артём", ACCOUNT_STATUS.ACTIVE, USER_ROLE.TEACHER, true),
    user(FIXTURE_USER_KEY.DUPLICATE_PENDING, "Морозов", "Артём", ACCOUNT_STATUS.REQUEST_PENDING, null, true),
  ];

  const accessRequests: FixtureAccessRequest[] = [
    { userKey: FIXTURE_USER_KEY.TEACHER_JUNIOR, status: ACCESS_REQUEST_STATUS.APPROVED, rejectReason: null },
    { userKey: FIXTURE_USER_KEY.TEACHER_MIDDLE, status: ACCESS_REQUEST_STATUS.APPROVED, rejectReason: null },
    { userKey: FIXTURE_USER_KEY.PENDING, status: ACCESS_REQUEST_STATUS.PENDING, rejectReason: null },
    { userKey: FIXTURE_USER_KEY.DUPLICATE_PENDING, status: ACCESS_REQUEST_STATUS.PENDING, rejectReason: null },
    { userKey: FIXTURE_USER_KEY.DUPLICATE_ACTIVE, status: ACCESS_REQUEST_STATUS.APPROVED, rejectReason: null },
    { userKey: FIXTURE_USER_KEY.REJECTED, status: ACCESS_REQUEST_STATUS.REJECTED, rejectReason: REJECT_PARENTS },
  ];

  const deletions: FixtureDeletion[] = [
    {
      key: "account-new",
      type: DELETION_REQUEST_TYPE.ACCOUNT,
      status: DELETION_REQUEST_STATUS.NEW,
      subjectUserKey: FIXTURE_USER_KEY.DISABLED,
      subjectPupilKey: null,
      reason: "Просит удалить учётную запись",
      rejectReason: null,
      requestedOn: "2026-10-01",
    },
    {
      key: "account-cancelled",
      type: DELETION_REQUEST_TYPE.ACCOUNT,
      status: DELETION_REQUEST_STATUS.CANCELLED,
      subjectUserKey: FIXTURE_USER_KEY.DUPLICATE_ACTIVE,
      subjectPupilKey: null,
      reason: "Запрос отозван",
      rejectReason: null,
      requestedOn: "2026-09-10",
    },
    {
      key: "child-progress",
      type: DELETION_REQUEST_TYPE.CHILD_DATA,
      status: DELETION_REQUEST_STATUS.IN_PROGRESS,
      subjectUserKey: null,
      subjectPupilKey: "a2",
      reason: "Родители просят удалить данные ребёнка",
      rejectReason: null,
      requestedOn: "2026-10-05",
    },
    {
      key: "child-rejected",
      type: DELETION_REQUEST_TYPE.CHILD_DATA,
      status: DELETION_REQUEST_STATUS.REJECTED,
      subjectUserKey: null,
      subjectPupilKey: "b1",
      reason: "Просьба удалить данные ребёнка",
      rejectReason: "Согласие родителей на хранение данных подтверждено",
      requestedOn: "2026-09-20",
    },
  ];

  return { users, accessRequests, deletions, events: buildEvents(fixture) };
}

function buildEvents(fixture: Fixture): FixtureEvent[] {
  const events: FixtureEvent[] = fixture.lessons.map((lesson) => ({
    key: `lesson:${lesson.gradeKey}:${lesson.yearKey}:${lesson.index}`,
    gradeKey: lesson.gradeKey,
    yearKey: lesson.yearKey,
    date: lesson.date,
    type: GRADE_EVENT_TYPE.LESSON,
    title: lesson.title,
    lessonIndex: lesson.index,
  }));
  const active = fixture.years.find((year) => year.status === ACADEMIC_YEAR_STATUS.ACTIVE);
  if (!active) return events;
  for (const gradeKey of Object.values(GRADE_KEY)) {
    events.push({
      key: `trip:${gradeKey}`,
      gradeKey,
      yearKey: active.key,
      date: "2026-10-18",
      type: GRADE_EVENT_TYPE.TRIP,
      title: "Выезд",
      lessonIndex: null,
    });
    events.push({
      key: `cancel:${gradeKey}`,
      gradeKey,
      yearKey: active.key,
      date: "2026-11-01",
      type: GRADE_EVENT_TYPE.CANCELLATION,
      title: "Занятие отменено",
      lessonIndex: null,
    });
  }
  return events;
}
