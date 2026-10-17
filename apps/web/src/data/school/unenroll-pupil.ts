import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  canUnenrollOrTransfer,
  unenrollPupilInputSchema,
  type MutationResult,
  type UnenrollPupilInput,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr, userHasAdminRole } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  assertEnrollmentActorForGrade,
  closeActiveEnrollment,
  loadActiveEnrollment,
} from "./school-enrollment-shared.server";
import { assertYearNotClosed, loadAcademicYearInOrganization } from "./school-group-shared.server";
import {
  loadActorOrganizationId,
  loadPupilInOrganization,
  lockPupilRow,
} from "./school-pupil-shared.server";

type Tx = Prisma.TransactionClient;

export async function unenrollPupilInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: UnenrollPupilInput,
): Promise<MutationResult> {
  const locked = await lockPupilRow(tx, input.pupilId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupil = await loadPupilInOrganization(tx, input.pupilId, organizationId);
  if (isMutationErr(pupil)) return pupil;

  const active = await loadActiveEnrollment(tx, input.pupilId);
  const notEnrolled = canUnenrollOrTransfer(active !== null);
  if (notEnrolled) return notEnrolled;

  const enrollmentYear = await loadAcademicYearInOrganization(
    tx,
    active!.academicYearId,
    organizationId,
  );
  if (isMutationErr(enrollmentYear)) return enrollmentYear;
  const yearClosed = assertYearNotClosed(enrollmentYear.status);
  if (yearClosed) return yearClosed;

  const isAdmin = await userHasAdminRole(tx, actorUserId);
  if (!isAdmin) {
    const actor = await assertEnrollmentActorForGrade(
      tx,
      actorUserId,
      organizationId,
      active!.gradeId,
    );
    if (isMutationErr(actor)) return actor;
  }

  const closeError = await closeActiveEnrollment(tx, active!.id, input.endsOn);
  if (closeError) return closeError;

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.ENROLLMENT,
    entityId: active!.id,
    action: AUDIT_ACTION.SCHOOL_PUPIL_UNENROLLED,
    newValue: { pupilId: input.pupilId, gradeId: active!.gradeId, endsOn: input.endsOn },
  });

  return { ok: true };
}

export async function unenrollPupil(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = unenrollPupilInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return unenrollPupilInTransaction(tx, actorUserId, organizationId, parsed.data);
  });
}
