import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  PARENT_APPROVAL_LINK_MODE,
  canAttachPupil,
  canPersistFamily,
  canSetAdultRelation,
  type AdultRelation,
  type ApproveParentLinkInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma } from "@sunschool/db";
import {
  assertFamilyCreateAccess,
  assertFamilyMutateAccess,
} from "../families/family-mutate-access.server";
import { mapFamilyPrismaError } from "../families/family-prisma-errors";
import { lockPupilRow } from "../school/school-pupil-shared.server";

type Tx = Prisma.TransactionClient;

type ApprovedUserProfile = {
  id: string;
  lastName: string | null;
  firstName: string | null;
  middleName: string | null;
  email: string | null;
};

function defaultFamilyName(profile: ApprovedUserProfile): string {
  const surname = profile.lastName?.trim();
  return surname && surname.length > 0 ? surname : "Семья";
}

function requireUserNames(profile: ApprovedUserProfile): MutationResult<{ lastName: string; firstName: string }> {
  const lastName = profile.lastName?.trim();
  const firstName = profile.firstName?.trim();
  if (!lastName || !firstName) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.approvals.parent_name_required",
    };
  }
  return { ok: true, data: { lastName, firstName } };
}

async function linkExistingAdult(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  profile: ApprovedUserProfile,
  adultId: string,
): Promise<MutationResult> {
  const adult = await tx.familyAdult.findUnique({
    where: { id: adultId },
    select: {
      id: true,
      userId: true,
      email: true,
      familyId: true,
      family: { select: { organizationId: true } },
    },
  });
  if (!adult || adult.family.organizationId !== organizationId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  if (adult.userId) {
    return { ok: false, code: MUTATION_ERROR_CODES.CONFLICT, message: "admin.family.adult_has_account" };
  }

  const accessError = await assertFamilyMutateAccess(tx, actorUserId, organizationId, adult.familyId);
  if (accessError) return accessError;

  await tx.familyAdult.update({
    where: { id: adult.id },
    data: {
      userId: profile.id,
      email: adult.email ?? profile.email ?? null,
    },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.FAMILY_ADULT,
    entityId: adult.id,
    action: AUDIT_ACTION.FAMILY_ADULT_CHANGED,
    newValue: { adultId: adult.id, familyId: adult.familyId, change: "linked_account" },
  });

  return { ok: true };
}

async function joinChildFamily(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  profile: ApprovedUserProfile,
  pupilId: string,
  relation: AdultRelation,
): Promise<MutationResult> {
  if (!(await lockPupilRow(tx, pupilId))) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupil = await tx.pupil.findFirst({
    where: { id: pupilId, organizationId },
    select: { id: true, familyId: true },
  });
  if (!pupil?.familyId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const accessError = await assertFamilyMutateAccess(tx, actorUserId, organizationId, pupil.familyId);
  if (accessError) return accessError;

  const existingAdult = await tx.familyAdult.findFirst({
    where: { familyId: pupil.familyId, userId: profile.id },
    select: { id: true },
  });
  if (existingAdult) {
    return { ok: false, code: MUTATION_ERROR_CODES.CONFLICT, message: "admin.family.adult_already_member" };
  }

  const adults = await tx.familyAdult.findMany({
    where: { familyId: pupil.familyId },
    select: { relation: true },
  });
  const relationError = canSetAdultRelation(adults.map((row) => row.relation), relation);
  if (relationError) return relationError;

  const names = requireUserNames(profile);
  if (!names.ok) return names;

  try {
    const adult = await tx.familyAdult.create({
      data: {
        familyId: pupil.familyId,
        relation,
        lastName: names.data.lastName,
        firstName: names.data.firstName,
        middleName: profile.middleName?.trim() || null,
        phones: [],
        email: profile.email ?? null,
        userId: profile.id,
      },
      select: { id: true },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.FAMILY_ADULT,
      entityId: adult.id,
      action: AUDIT_ACTION.FAMILY_ADULT_CHANGED,
      newValue: { adultId: adult.id, familyId: pupil.familyId, change: "added", relation },
    });

    return { ok: true };
  } catch (error) {
    const mapped = mapFamilyPrismaError(error);
    if (mapped) return mapped;
    throw error;
  }
}

async function createFamilyForPupils(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  profile: ApprovedUserProfile,
  pupilIds: string[],
  relation: AdultRelation,
  familyName?: string,
): Promise<MutationResult> {
  const createAccess = await assertFamilyCreateAccess(tx, actorUserId);
  if (createAccess) return createAccess;

  const uniquePupilIds = [...new Set(pupilIds)];
  for (const pupilId of uniquePupilIds) {
    if (!(await lockPupilRow(tx, pupilId))) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
  }

  const pupils = await tx.pupil.findMany({
    where: { id: { in: uniquePupilIds }, organizationId },
    select: { id: true, familyId: true },
  });
  if (pupils.length !== uniquePupilIds.length) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  for (const pupil of pupils) {
    const attachError = canAttachPupil(pupil.familyId);
    if (attachError) return attachError;
  }

  const emptyError = canPersistFamily(1, pupils.length);
  if (emptyError) return emptyError;

  const names = requireUserNames(profile);
  if (!names.ok) return names;

  const resolvedName = familyName?.trim() || defaultFamilyName(profile);

  try {
    const family = await tx.family.create({
      data: {
        organizationId,
        name: resolvedName,
      },
      select: { id: true },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.FAMILY,
      entityId: family.id,
      action: AUDIT_ACTION.FAMILY_UPSERTED,
      newValue: { familyId: family.id, created: true, via: "approve_parent" },
    });

    const adult = await tx.familyAdult.create({
      data: {
        familyId: family.id,
        relation,
        lastName: names.data.lastName,
        firstName: names.data.firstName,
        middleName: profile.middleName?.trim() || null,
        phones: [],
        email: profile.email ?? null,
        userId: profile.id,
      },
      select: { id: true },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.FAMILY_ADULT,
      entityId: adult.id,
      action: AUDIT_ACTION.FAMILY_ADULT_CHANGED,
      newValue: { adultId: adult.id, familyId: family.id, change: "added", relation },
    });

    for (const pupil of pupils) {
      await tx.pupil.update({
        where: { id: pupil.id },
        data: { familyId: family.id },
      });

      await writeAudit(tx, {
        actorUserId,
        source: AUDIT_SOURCE.USER,
        entityType: AUDIT_ENTITY_TYPE.PUPIL,
        entityId: pupil.id,
        action: AUDIT_ACTION.FAMILY_PUPIL_TRANSFERRED,
        newValue: { pupilId: pupil.id, targetFamilyId: family.id, sourceFamilyId: null },
      });
    }

    return { ok: true };
  } catch (error) {
    const mapped = mapFamilyPrismaError(error);
    if (mapped) return mapped;
    throw error;
  }
}

/** families_and_parents_contract §6.2 — link approved parent account to a family (AZ-59). */
export async function approveParentRequestInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  approvedUserId: string,
  parentLink: ApproveParentLinkInput,
): Promise<MutationResult> {
  const profile = await tx.appUser.findUnique({
    where: { id: approvedUserId },
    select: {
      id: true,
      lastName: true,
      firstName: true,
      middleName: true,
      email: true,
      organizationId: true,
    },
  });
  if (!profile || profile.organizationId !== organizationId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  switch (parentLink.mode) {
    case PARENT_APPROVAL_LINK_MODE.LINK_EXISTING_ADULT:
      return linkExistingAdult(tx, actorUserId, organizationId, profile, parentLink.adultId);
    case PARENT_APPROVAL_LINK_MODE.JOIN_CHILD_FAMILY:
      return joinChildFamily(
        tx,
        actorUserId,
        organizationId,
        profile,
        parentLink.pupilId,
        parentLink.relation,
      );
    case PARENT_APPROVAL_LINK_MODE.CREATE_FAMILY:
      return createFamilyForPupils(
        tx,
        actorUserId,
        organizationId,
        profile,
        parentLink.pupilIds,
        parentLink.relation,
        parentLink.familyName,
      );
    default:
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.VALIDATION,
        message: "admin.approvals.parent_link_required",
      };
  }
}
