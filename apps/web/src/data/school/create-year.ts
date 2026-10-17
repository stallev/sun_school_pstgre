import "server-only";
import {
  ACADEMIC_YEAR_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  createYearInputSchema,
  validateYearDates,
  validateYearNoOverlap,
  type CreateYearInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { calendarDateFromIso, isoFromCalendarDate } from "./calendar-date";
import { copyYearStructureFromPriorYear } from "./copy-year-structure.server";

type Tx = Prisma.TransactionClient;

export async function createYearInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: CreateYearInput,
): Promise<MutationResult<{ yearId: string }>> {
  const datesError = validateYearDates(input.startsOn, input.endsOn);
  if (datesError) return datesError;

  const existing = await tx.academicYear.findMany({
    where: { organizationId },
    select: { startsOn: true, endsOn: true },
  });
  const overlapError = validateYearNoOverlap(
    { startsOn: input.startsOn, endsOn: input.endsOn },
    existing.map((year) => ({
      startsOn: isoFromCalendarDate(year.startsOn),
      endsOn: isoFromCalendarDate(year.endsOn),
    })),
  );
  if (overlapError) return overlapError;

  const created = await tx.academicYear.create({
    data: {
      organizationId,
      name: input.name,
      startsOn: calendarDateFromIso(input.startsOn),
      endsOn: calendarDateFromIso(input.endsOn),
      status: ACADEMIC_YEAR_STATUS.DRAFT,
    },
    select: { id: true },
  });

  await copyYearStructureFromPriorYear(tx, organizationId, created.id);

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.ACADEMIC_YEAR,
    entityId: created.id,
    action: AUDIT_ACTION.SCHOOL_YEAR_CREATED,
    newValue: { name: input.name, startsOn: input.startsOn, endsOn: input.endsOn },
  });

  return { ok: true, data: { yearId: created.id } };
}

async function loadActorOrganizationId(tx: Tx, actorUserId: string): Promise<string | null> {
  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function createYear(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ yearId: string }>> {
  const parsed = createYearInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return createYearInTransaction(tx, actorUserId, organizationId, parsed.data);
  });
}
