import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  updateGradeSettingsInputSchema,
  validateScoreWeights,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  assertYearNotClosed,
  loadAcademicYearInOrganization,
  loadGradeInOrganization,
} from "./school-group-shared.server";

type Tx = Prisma.TransactionClient;

async function loadActorOrganizationId(tx: Tx, actorUserId: string): Promise<string | null> {
  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function updateGradeSettings(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = updateGradeSettingsInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const weightsError = validateScoreWeights(parsed.data.weights);
  if (weightsError) return weightsError;

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const year = await loadAcademicYearInOrganization(tx, parsed.data.yearId, organizationId);
    if (isMutationErr(year)) return year;
    const yearClosed = assertYearNotClosed(year.status);
    if (yearClosed) return yearClosed;

    const grade = await loadGradeInOrganization(tx, parsed.data.gradeId, organizationId);
    if (isMutationErr(grade)) return grade;

    const settings = await tx.gradeSettings.findUnique({
      where: {
        gradeId_academicYearId: { gradeId: parsed.data.gradeId, academicYearId: parsed.data.yearId },
      },
    });
    if (!settings) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    await tx.gradeSettings.update({
      where: { id: settings.id },
      data: {
        useVerses: parsed.data.useVerses,
        useTest: parsed.data.useTest,
        useNotebook: parsed.data.useNotebook,
        useSinging: parsed.data.useSinging,
        maxVersesPerLesson: parsed.data.maxVersesPerLesson,
        labels: parsed.data.labels,
        weights: parsed.data.weights,
        recitationDaysN: parsed.data.recitationDaysN,
      },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.GRADE_SETTINGS,
      entityId: settings.id,
      action: AUDIT_ACTION.SCHOOL_SETTINGS_CHANGED,
      newValue: {
        gradeId: parsed.data.gradeId,
        yearId: parsed.data.yearId,
        maxVersesPerLesson: parsed.data.maxVersesPerLesson,
      },
    });

    return { ok: true };
  });
}
