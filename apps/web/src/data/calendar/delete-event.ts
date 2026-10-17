import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  deleteCalendarEventInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActiveAcademicYearId } from "../access/active-academic-year.server";
import { loadActorOrganizationId } from "../lessons/lesson-shared.server";
import {
  assertCalendarActorForEvent,
  lessonDateToIso,
  loadGradeEventInOrganization,
} from "./calendar-shared.server";

export async function deleteCalendarEvent(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = deleteCalendarEventInputSchema.safeParse(raw);
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

    await tx.gradeEvent.delete({ where: { id: existing.id } });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.GRADE_EVENT,
      entityId: existing.id,
      action: AUDIT_ACTION.CALENDAR_EVENT_DELETED,
      oldValue: {
        gradeId: existing.gradeId,
        eventDate: lessonDateToIso(existing.eventDate),
        type: existing.type,
      },
    });

    return { ok: true };
  });
}
