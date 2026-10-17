import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  updateGroupInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { Prisma, writeAudit, type PrismaClient } from "@sunschool/db";
import { calendarDateFromIso } from "./calendar-date";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { assertActiveGroupNameAvailable, loadGradeInOrganization } from "./school-group-shared.server";

type Tx = Prisma.TransactionClient;

async function loadActorOrganizationId(tx: Tx, actorUserId: string): Promise<string | null> {
  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function updateGroup(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = updateGroupInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const grade = await loadGradeInOrganization(tx, parsed.data.gradeId, organizationId);
    if (isMutationErr(grade)) return grade;

    if (parsed.data.isActive) {
      const nameError = await assertActiveGroupNameAvailable(
        tx,
        organizationId,
        parsed.data.name,
        parsed.data.gradeId,
      );
      if (nameError) return nameError;
    }

    const deactivating = grade.isActive && !parsed.data.isActive;

    await tx.grade.update({
      where: { id: parsed.data.gradeId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        ageMin: parsed.data.ageMin ?? null,
        ageMax: parsed.data.ageMax ?? null,
        isActive: parsed.data.isActive,
      },
    });

    if (deactivating) {
      await tx.enrollment.updateMany({
        where: { gradeId: parsed.data.gradeId, endsOn: null },
        data: { endsOn: calendarDateFromIso(new Date().toISOString().slice(0, 10)) },
      });
    }

    const action = parsed.data.isActive
      ? AUDIT_ACTION.SCHOOL_GROUP_UPDATED
      : AUDIT_ACTION.SCHOOL_GROUP_DEACTIVATED;

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.GRADE,
      entityId: parsed.data.gradeId,
      action,
      oldValue: { name: grade.name, isActive: grade.isActive },
      newValue: { name: parsed.data.name, isActive: parsed.data.isActive },
    });

    return { ok: true };
  });
}
