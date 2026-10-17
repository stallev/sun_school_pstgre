import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  canEnroll,
  enrollPupilInputSchema,
  type EnrollPupilInput,
  type MutationResult,
} from "@sunschool/domain";
import { Prisma, writeAudit, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { calendarDateFromIso } from "./calendar-date";
import {
  assertEnrollmentActorForGrade,
  loadActiveEnrollment,
} from "./school-enrollment-shared.server";
import { loadGradeInOrganization } from "./school-group-shared.server";
import {
  isoTodayUtc,
  loadActorOrganizationId,
  loadPupilInOrganization,
  lockPupilRow,
  resolvePupilConsentStatus,
} from "./school-pupil-shared.server";

type Tx = Prisma.TransactionClient;

export async function enrollPupilInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: EnrollPupilInput,
  todayIso: string,
): Promise<MutationResult> {
  const actor = await assertEnrollmentActorForGrade(tx, actorUserId, organizationId, input.gradeId);
  if (isMutationErr(actor)) return actor;

  const grade = await loadGradeInOrganization(tx, input.gradeId, organizationId);
  if (isMutationErr(grade)) return grade;

  const locked = await lockPupilRow(tx, input.pupilId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupil = await loadPupilInOrganization(tx, input.pupilId, organizationId);
  if (isMutationErr(pupil)) return pupil;

  const activeEnrollment = await loadActiveEnrollment(tx, input.pupilId);
  const consentStatus = await resolvePupilConsentStatus(tx, input.pupilId, todayIso);

  const legacyRow = await tx.appSetting.findUnique({
    where: { key: "legacy_consent_deadline_on" },
    select: { value: true },
  });
  const legacyConsentDeadlineOn =
    legacyRow?.value && typeof legacyRow.value === "string" ? legacyRow.value : null;

  const enrollError = canEnroll({
    today: todayIso,
    consentStatus,
    legacyConsentDeadlineOn,
    hasActiveEnrollment: activeEnrollment !== null,
    isGroupActive: grade.isActive,
    yearStatus: actor.year.status,
  });
  if (enrollError) return enrollError;

  let enrollmentId = "";
  try {
    const created = await tx.enrollment.create({
      data: {
        pupilId: input.pupilId,
        gradeId: input.gradeId,
        academicYearId: actor.year.id,
        startsOn: calendarDateFromIso(input.startsOn),
      },
      select: { id: true },
    });
    enrollmentId = created.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.SCHOOL_ALREADY_ENROLLED,
        message: "admin.people.already_enrolled",
      };
    }
    throw error;
  }

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.ENROLLMENT,
    entityId: enrollmentId,
    action: AUDIT_ACTION.SCHOOL_PUPIL_ENROLLED,
    newValue: { pupilId: input.pupilId, gradeId: input.gradeId, yearId: actor.year.id },
  });

  return { ok: true };
}

export async function enrollPupil(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = enrollPupilInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const todayIso = isoTodayUtc();

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return enrollPupilInTransaction(tx, actorUserId, organizationId, parsed.data, todayIso);
  });
}
