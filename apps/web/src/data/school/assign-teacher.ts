import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  assignTeacherInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { Prisma, writeAudit, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  assertUserIsActiveTeacher,
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

export async function assignTeacher(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = assignTeacherInputSchema.safeParse(raw);
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
    if (!grade.isActive) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.SCHOOL_GROUP_INACTIVE,
        message: "admin.group.inactive",
      };
    }

    const teacherError = await assertUserIsActiveTeacher(tx, parsed.data.userId, organizationId);
    if (teacherError) return teacherError;

    const existing = await tx.teacherAssignment.findUnique({
      where: {
        userId_gradeId_academicYearId: {
          userId: parsed.data.userId,
          gradeId: parsed.data.gradeId,
          academicYearId: parsed.data.yearId,
        },
      },
    });
    if (existing) return { ok: true };

    let assignmentId = "";
    try {
      const created = await tx.teacherAssignment.create({
        data: {
          userId: parsed.data.userId,
          gradeId: parsed.data.gradeId,
          academicYearId: parsed.data.yearId,
        },
      });
      assignmentId = created.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return { ok: true };
      }
      throw error;
    }

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.TEACHER_ASSIGNMENT,
      entityId: assignmentId,
      action: AUDIT_ACTION.SCHOOL_TEACHER_ASSIGNED,
      newValue: { userId: parsed.data.userId, gradeId: parsed.data.gradeId, yearId: parsed.data.yearId },
    });

    return { ok: true };
  });
}
