import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  changeLeadTeacherInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  assertLeadTeacherOnGrade,
  assertLessonActorForExisting,
  loadActorOrganizationId,
  loadLessonInOrganization,
} from "./lesson-shared.server";

export async function changeLeadTeacher(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = changeLeadTeacherInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const lesson = await loadLessonInOrganization(tx, parsed.data.lessonId, organizationId);
    if (isMutationErr(lesson)) return lesson;

    const actor = await assertLessonActorForExisting(tx, actorUserId, organizationId, lesson);
    if (isMutationErr(actor)) return actor;

    const leadError = await assertLeadTeacherOnGrade(
      tx,
      parsed.data.leadTeacherId,
      lesson.gradeId,
      lesson.academicYearId,
      organizationId,
    );
    if (leadError) return leadError;

    if (lesson.leadTeacherId === parsed.data.leadTeacherId) {
      return { ok: true };
    }

    await tx.lesson.update({
      where: { id: lesson.id },
      data: { leadTeacherId: parsed.data.leadTeacherId },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.LESSON,
      entityId: lesson.id,
      action: AUDIT_ACTION.LESSON_LEAD_CHANGED,
      oldValue: { leadTeacherId: lesson.leadTeacherId },
      newValue: { leadTeacherId: parsed.data.leadTeacherId },
    });

    return { ok: true };
  });
}
