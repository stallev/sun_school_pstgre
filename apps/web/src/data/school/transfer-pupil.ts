import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  canEnroll,
  canUnenrollOrTransfer,
  transferPupilInputSchema,
  type MutationResult,
  type TransferPupilInput,
} from "@sunschool/domain";
import { Prisma, writeAudit, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { calendarDateFromIso, subtractCalendarDays } from "./calendar-date";
import {
  assertAdminActor,
  closeActiveEnrollment,
  isoFromEnrollmentStartsOn,
  loadActiveEnrollment,
  resolveEnrollmentAcademicYear,
} from "./school-enrollment-shared.server";
import { assertYearNotClosed, loadGradeInOrganization } from "./school-group-shared.server";
import {
  isoTodayUtc,
  loadActorOrganizationId,
  loadPupilInOrganization,
  lockPupilRow,
  resolvePupilConsentStatus,
} from "./school-pupil-shared.server";

type Tx = Prisma.TransactionClient;

export async function transferPupilInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: TransferPupilInput,
  todayIso: string,
): Promise<MutationResult> {
  const adminError = await assertAdminActor(tx, actorUserId);
  if (adminError) return adminError;

  const toGrade = await loadGradeInOrganization(tx, input.toGradeId, organizationId);
  if (isMutationErr(toGrade)) return toGrade;

  const year = await resolveEnrollmentAcademicYear(tx, organizationId, false);
  if (isMutationErr(year)) return year;
  const yearClosed = assertYearNotClosed(year.status);
  if (yearClosed) return yearClosed;

  const locked = await lockPupilRow(tx, input.pupilId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupil = await loadPupilInOrganization(tx, input.pupilId, organizationId);
  if (isMutationErr(pupil)) return pupil;

  const active = await loadActiveEnrollment(tx, input.pupilId);
  const notEnrolled = canUnenrollOrTransfer(active !== null);
  if (notEnrolled) return notEnrolled;

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
    hasActiveEnrollment: false,
    isGroupActive: toGrade.isActive,
    yearStatus: year.status,
  });
  if (enrollError) return enrollError;

  const startsIso = isoFromEnrollmentStartsOn(active!.startsOn);
  const closeEndsOn =
    input.onDate > startsIso ? subtractCalendarDays(input.onDate, 1) : startsIso;

  const closeError = await closeActiveEnrollment(tx, active!.id, closeEndsOn);
  if (closeError) return closeError;

  let newEnrollmentId = "";
  try {
    const created = await tx.enrollment.create({
      data: {
        pupilId: input.pupilId,
        gradeId: input.toGradeId,
        academicYearId: year.id,
        startsOn: calendarDateFromIso(input.onDate),
      },
      select: { id: true },
    });
    newEnrollmentId = created.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, code: MUTATION_ERROR_CODES.CONFLICT, message: "common.errors.conflict" };
    }
    throw error;
  }

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.ENROLLMENT,
    entityId: newEnrollmentId,
    action: AUDIT_ACTION.SCHOOL_PUPIL_TRANSFERRED,
    oldValue: { gradeId: active!.gradeId },
    newValue: { pupilId: input.pupilId, fromGradeId: active!.gradeId, toGradeId: input.toGradeId },
  });

  return { ok: true };
}

export async function transferPupil(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = transferPupilInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const todayIso = isoTodayUtc();

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return transferPupilInTransaction(tx, actorUserId, organizationId, parsed.data, todayIso);
  });
}
