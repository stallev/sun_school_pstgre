import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  updateCalendarEventInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActiveAcademicYearId } from "../access/active-academic-year.server";
import { lockLessonYearAndAssertActive, loadActorOrganizationId } from "../lessons/lesson-shared.server";
import {
  assertCalendarActorForEvent,
  isoToLessonDate,
  lessonDateToIso,
  loadGradeEventInOrganization,
  validateCalendarLessonLink,
} from "./calendar-shared.server";

export async function updateCalendarEvent(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = updateCalendarEventInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const existing = await loadGradeEventInOrganization(tx, parsed.data.eventId, organizationId);
    if (isMutationErr(existing)) return existing;

    const activeYearId = await loadActiveAcademicYearId(tx, organizationId);
    if (!activeYearId) {
      return { ok: false, code: MUTATION_ERROR_CODES.CHECK_YEAR_NOT_ACTIVE, message: "teacher.lesson.year_not_active" };
    }

    const actor = await assertCalendarActorForEvent(
      tx,
      actorUserId,
      organizationId,
      existing,
      activeYearId,
    );
    if (isMutationErr(actor)) return actor;

    const year = await lockLessonYearAndAssertActive(
      tx,
      activeYearId,
      organizationId,
      parsed.data.eventDate,
    );
    if (isMutationErr(year)) return year;

    const lessonError = await validateCalendarLessonLink(
      tx,
      organizationId,
      existing.gradeId,
      parsed.data.type,
      parsed.data.lessonId,
    );
    if (lessonError) return lessonError;

    const updated = await tx.gradeEvent.update({
      where: { id: existing.id },
      data: {
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
      entityId: updated.id,
      action: AUDIT_ACTION.CALENDAR_EVENT_UPDATED,
      oldValue: {
        eventDate: lessonDateToIso(existing.eventDate),
        type: existing.type,
        lessonId: existing.lessonId,
      },
      newValue: {
        eventDate: parsed.data.eventDate,
        type: parsed.data.type,
        lessonId: parsed.data.lessonId ?? null,
      },
    });

    return { ok: true };
  });
}
