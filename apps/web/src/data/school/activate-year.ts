import "server-only";
import {
  ACADEMIC_YEAR_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  activateYearInputSchema,
  canActivateYear,
  type ActivateYearInput,
  type MutationResult,
} from "@sunschool/domain";
import { Prisma, writeAudit, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  loadAcademicYearForOrganization,
  lockOrganizationAcademicYears,
  organizationHasActiveYear,
} from "./school-year-guards.server";

type Tx = Prisma.TransactionClient;

const isActiveYearUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

export async function activateYearInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: ActivateYearInput,
): Promise<MutationResult> {
  await lockOrganizationAcademicYears(tx, organizationId);

  const loaded = await loadAcademicYearForOrganization(tx, input.yearId, organizationId);
  if (isMutationErr(loaded)) return loaded;

  const domainError = canActivateYear({
    yearStatus: loaded.status,
    hasOtherActiveYear: await organizationHasActiveYear(tx, organizationId, loaded.id),
  });
  if (domainError) return domainError;

  try {
    await tx.academicYear.update({
      where: { id: loaded.id },
      data: { status: ACADEMIC_YEAR_STATUS.ACTIVE },
    });
  } catch (error) {
    if (isActiveYearUniqueViolation(error)) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.SCHOOL_YEAR_ACTIVE_EXISTS,
        message: "admin.year.active_exists",
      };
    }
    throw error;
  }

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.ACADEMIC_YEAR,
    entityId: loaded.id,
    action: AUDIT_ACTION.SCHOOL_YEAR_ACTIVATED,
    oldValue: { status: loaded.status },
    newValue: { status: ACADEMIC_YEAR_STATUS.ACTIVE },
  });

  return { ok: true };
}

async function loadActorOrganizationId(tx: Tx, actorUserId: string): Promise<string | null> {
  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function activateYear(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = activateYearInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction((tx) =>
    loadActorOrganizationId(tx, actorUserId).then((organizationId) => {
      if (!organizationId) {
        return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
      }
      return activateYearInTransaction(tx, actorUserId, organizationId, parsed.data);
    }),
  );
}
