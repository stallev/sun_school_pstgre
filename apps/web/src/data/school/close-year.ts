import "server-only";
import {
  ACADEMIC_YEAR_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  canCloseYear,
  closeYearInputSchema,
  type CloseYearInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadAcademicYearForOrganization, lockAcademicYearRow } from "./school-year-guards.server";

type Tx = Prisma.TransactionClient;

export async function closeYearInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: CloseYearInput,
): Promise<MutationResult> {
  const locked = await lockAcademicYearRow(tx, input.yearId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const loaded = await loadAcademicYearForOrganization(tx, input.yearId, organizationId);
  if (isMutationErr(loaded)) return loaded;

  const domainError = canCloseYear({ yearStatus: loaded.status });
  if (domainError) return domainError;

  await tx.academicYear.update({
    where: { id: loaded.id },
    data: { status: ACADEMIC_YEAR_STATUS.CLOSED },
  });

  // Assignments have no ends_on column; closure is enforced via academic_year.status (contract §5.1, DDL).
  await tx.enrollment.updateMany({
    where: { academicYearId: loaded.id, endsOn: null },
    data: { endsOn: loaded.endsOn },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.ACADEMIC_YEAR,
    entityId: loaded.id,
    action: AUDIT_ACTION.SCHOOL_YEAR_CLOSED,
    oldValue: { status: loaded.status },
    newValue: { status: ACADEMIC_YEAR_STATUS.CLOSED },
    reason: input.reason ?? null,
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

export async function closeYear(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = closeYearInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return closeYearInTransaction(tx, actorUserId, organizationId, parsed.data);
  });
}
