import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  createCalendarEventInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  assertLessonActorForGrade,
  lockLessonYearAndAssertActive,
  loadActorOrganizationId,
} from "../lessons/lesson-shared.server";
import {
  assertCalendarMutateAllowed,
  assertGradeActiveForCalendar,
  isoToLessonDate,
  validateCalendarLessonLink,
} from "./calendar-shared.server";

export async function createCalendarEvent(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ eventId: string }>> {
  const parsed = createCalendarEventInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const gradeError = await assertGradeActiveForCalendar(tx, parsed.data.gradeId, organizationId);
    if (gradeError) return gradeError;

    const actor = await assertLessonActorForGrade(tx, actorUserId, organizationId, parsed.data.gradeId);
    if (isMutationErr(actor)) return actor;

    const mutate = await assertCalendarMutateAllowed(
      tx,
      actorUserId,
      organizationId,
      parsed.data.gradeId,
      actor.year.id,
    );
    if (isMutationErr(mutate)) return mutate;

    const year = await lockLessonYearAndAssertActive(
      tx,
      actor.year.id,
      organizationId,
      parsed.data.eventDate,
    );
    if (isMutationErr(year)) return year;

    const lessonError = await validateCalendarLessonLink(
      tx,
      organizationId,
      parsed.data.gradeId,
      parsed.data.type,
      parsed.data.lessonId,
    );
    if (lessonError) return lessonError;

    const event = await tx.gradeEvent.create({
      data: {
        gradeId: parsed.data.gradeId,
        eventDate: isoToLessonDate(parsed.data.eventDate),
        type: parsed.data.type,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        lessonId: parsed.data.lessonId ?? null,
      },
      select: { id: true },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.GRADE_EVENT,
      entityId: event.id,
      action: AUDIT_ACTION.CALENDAR_EVENT_CREATED,
      newValue: {
        gradeId: parsed.data.gradeId,
        eventDate: parsed.data.eventDate,
        type: parsed.data.type,
        lessonId: parsed.data.lessonId ?? null,
      },
    });

    return { ok: true, data: { eventId: event.id } };
  });
}
