import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  unassignTeacherInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  assertYearNotClosed,
  loadAcademicYearInOrganization,
  loadGradeInOrganization,
} from "./school-group-shared.server";

type Tx = Prisma.TransactionClient;

async function loadActorOrganizationId(tx: Tx, actorUserId: string): Promise<string | null> {
  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function unassignTeacher(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = unassignTeacherInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const year = await loadAcademicYearInOrganization(tx, parsed.data.yearId, organizationId);
    if (isMutationErr(year)) return year;
    const yearClosed = assertYearNotClosed(year.status);
    if (yearClosed) return yearClosed;

    const grade = await loadGradeInOrganization(tx, parsed.data.gradeId, organizationId);
    if (isMutationErr(grade)) return grade;

    const assignment = await tx.teacherAssignment.findUnique({
      where: {
        userId_gradeId_academicYearId: {
          userId: parsed.data.userId,
          gradeId: parsed.data.gradeId,
          academicYearId: parsed.data.yearId,
        },
      },
    });
    if (!assignment) return { ok: true };

    await tx.teacherAssignment.delete({ where: { id: assignment.id } });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.TEACHER_ASSIGNMENT,
      entityId: assignment.id,
      action: AUDIT_ACTION.SCHOOL_TEACHER_UNASSIGNED,
      oldValue: { userId: parsed.data.userId, gradeId: parsed.data.gradeId, yearId: parsed.data.yearId },
    });

    return { ok: true };
  });
}
