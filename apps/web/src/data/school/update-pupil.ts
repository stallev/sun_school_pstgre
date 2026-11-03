import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  updatePupilInputSchema,
  type MutationResult,
  type UpdatePupilInput,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { calendarDateFromIso, isoFromCalendarDate } from "./calendar-date";
import {
  isoTodayUtc,
  loadActorOrganizationId,
  validateBirthDateInPast,
} from "./school-pupil-shared.server";

type Tx = Prisma.TransactionClient;

type PupilRow = {
  id: string;
  isActive: boolean;
  birthDate: Date | null;
  lastName: string;
  firstName: string;
  middleName: string | null;
};

const collectChangedFields = (pupil: PupilRow, input: UpdatePupilInput): string[] => {
  const fields: string[] = [];
  if (pupil.isActive !== input.isActive) fields.push("isActive");
  const currentBirthIso = pupil.birthDate ? isoFromCalendarDate(pupil.birthDate) : "";
  if (currentBirthIso !== input.birthDate) fields.push("birthDate");
  if (pupil.lastName !== input.lastName) fields.push("lastName");
  if (pupil.firstName !== input.firstName) fields.push("firstName");
  const currentMiddle = pupil.middleName ?? "";
  const nextMiddle = input.middleName ?? "";
  if (currentMiddle !== nextMiddle) fields.push("middleName");
  return fields;
};

export async function updatePupilInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: UpdatePupilInput,
  todayIso: string,
): Promise<MutationResult> {
  const birthError = validateBirthDateInPast(input.birthDate, todayIso);
  if (birthError) return birthError;

  const pupil = await tx.pupil.findFirst({
    where: { id: input.pupilId, organizationId },
    select: {
      id: true,
      isActive: true,
      birthDate: true,
      lastName: true,
      firstName: true,
      middleName: true,
    },
  });
  if (!pupil) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const changedFields = collectChangedFields(pupil, input);

  await tx.pupil.update({
    where: { id: input.pupilId },
    data: {
      lastName: input.lastName,
      firstName: input.firstName,
      middleName: input.middleName ?? null,
      birthDate: calendarDateFromIso(input.birthDate),
      isActive: input.isActive,
    },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.PUPIL,
    entityId: input.pupilId,
    action: AUDIT_ACTION.SCHOOL_PUPIL_UPDATED,
    oldValue: { isActive: pupil.isActive },
    newValue: { isActive: input.isActive, fields: changedFields },
  });

  if (changedFields.includes("birthDate")) {
    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.PUPIL,
      entityId: input.pupilId,
      action: AUDIT_ACTION.SCHOOL_PUPIL_BIRTHDATE_UPDATED,
      newValue: { fields: ["birthDate"] },
    });
  }

  return { ok: true };
}

export async function updatePupil(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = updatePupilInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const todayIso = isoTodayUtc();

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return updatePupilInTransaction(tx, actorUserId, organizationId, parsed.data, todayIso);
  });
}
