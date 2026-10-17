import "server-only";
import {
  APP_LOCALE,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  setGroupLanguageInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { isEnglishBibleReady, loadGradeInOrganization } from "./school-group-shared.server";

type Tx = Prisma.TransactionClient;

async function loadActorOrganizationId(tx: Tx, actorUserId: string): Promise<string | null> {
  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function setGroupLanguage(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = setGroupLanguageInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const grade = await loadGradeInOrganization(tx, parsed.data.gradeId, organizationId);
    if (isMutationErr(grade)) return grade;

    if (parsed.data.language === APP_LOCALE.EN && !(await isEnglishBibleReady(tx))) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.SCHOOL_LANGUAGE_UNAVAILABLE,
        message: "admin.group.language_unavailable",
      };
    }

    await tx.grade.update({
      where: { id: parsed.data.gradeId },
      data: { language: parsed.data.language },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.GRADE,
      entityId: parsed.data.gradeId,
      action: AUDIT_ACTION.SCHOOL_GROUP_LANGUAGE_CHANGED,
      oldValue: { language: grade.language },
      newValue: { language: parsed.data.language },
    });

    return { ok: true };
  });
}
