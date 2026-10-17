import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  createPupilInputSchema,
  type CreatePupilInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";

type Tx = Prisma.TransactionClient;
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { calendarDateFromIso } from "./calendar-date";
import {
  isoTodayUtc,
  loadActorOrganizationId,
  validateBirthDateInPast,
} from "./school-pupil-shared.server";

export async function createPupilInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: CreatePupilInput,
  todayIso: string,
): Promise<MutationResult<{ pupilId: string }>> {
  const birthError = validateBirthDateInPast(input.birthDate, todayIso);
  if (birthError) return birthError;

  const pupil = await tx.pupil.create({
    data: {
      organizationId,
      lastName: input.lastName,
      firstName: input.firstName,
      middleName: input.middleName ?? null,
      birthDate: calendarDateFromIso(input.birthDate),
      isActive: input.isActive,
    },
    select: { id: true },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.PUPIL,
    entityId: pupil.id,
    action: AUDIT_ACTION.SCHOOL_PUPIL_CREATED,
    newValue: { isActive: input.isActive },
  });

  return { ok: true, data: { pupilId: pupil.id } };
}

export async function createPupil(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ pupilId: string }>> {
  const parsed = createPupilInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const todayIso = isoTodayUtc();

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    const result = await createPupilInTransaction(tx, actorUserId, organizationId, parsed.data, todayIso);
    if (isMutationErr(result)) return result;
    return result;
  });
}
