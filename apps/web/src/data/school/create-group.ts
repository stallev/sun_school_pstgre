import "server-only";
import {
  APP_LOCALE,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  createGroupInputSchema,
  defaultGradeScoreWeights,
  DEFAULT_MAX_VERSES_PER_LESSON,
  DEFAULT_RECITATION_DAYS_N,
  type CreateGroupInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { readFeaturesAchievementsEnabled } from "../achievements/achievement-feature.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  assertActiveGroupNameAvailable,
  resolveAcademicYearForNewGroupSettings,
} from "./school-group-shared.server";

type Tx = Prisma.TransactionClient;

async function loadActorOrganizationId(tx: Tx, actorUserId: string): Promise<string | null> {
  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function createGroup(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ gradeId: string }>> {
  const parsed = createGroupInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return createGroupInTransaction(tx, actorUserId, organizationId, parsed.data);
  });
}

export async function createGroupInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: CreateGroupInput,
): Promise<MutationResult<{ gradeId: string }>> {
  const nameError = await assertActiveGroupNameAvailable(tx, organizationId, input.name);
  if (nameError) return nameError;

  const grade = await tx.grade.create({
    data: {
      organizationId,
      name: input.name,
      description: input.description ?? null,
      ageMin: input.ageMin ?? null,
      ageMax: input.ageMax ?? null,
      language: APP_LOCALE.RU,
      isActive: true,
    },
    select: { id: true },
  });

  const year = await resolveAcademicYearForNewGroupSettings(tx, organizationId);
  if (year) {
    const achievementsEnabled = await readFeaturesAchievementsEnabled(tx);
    await tx.gradeSettings.create({
      data: {
        gradeId: grade.id,
        academicYearId: year.id,
        maxVersesPerLesson: DEFAULT_MAX_VERSES_PER_LESSON,
        labels: {},
        weights: defaultGradeScoreWeights(),
        recitationDaysN: DEFAULT_RECITATION_DAYS_N,
        achievementsEnabled,
      },
    });
  }

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.GRADE,
    entityId: grade.id,
    action: AUDIT_ACTION.SCHOOL_GROUP_CREATED,
    newValue: { name: input.name },
  });

  return { ok: true, data: { gradeId: grade.id } };
}
