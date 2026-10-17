import "server-only";
import { updateTag } from "next/cache";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  updateAppLanguageInputSchema,
  type MutationResult,
  type UpdateAppLanguageInput,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { mutationFromZodError } from "../access/map-zod-fields";
import { assertAdminActor } from "../school/school-enrollment-shared.server";

const APP_SETTING_UI_LOCALE_KEY = "ui_locale";

type Tx = Prisma.TransactionClient;

async function loadActorOrganizationId(tx: Tx, actorUserId: string): Promise<string | null> {
  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function updateAppLanguageInTransaction(
  tx: Tx,
  actorUserId: string,
  input: UpdateAppLanguageInput,
): Promise<MutationResult> {
  const adminError = await assertAdminActor(tx, actorUserId);
  if (adminError) return adminError;

  const existing = await tx.appSetting.findUnique({
    where: { key: APP_SETTING_UI_LOCALE_KEY },
    select: { value: true },
  });
  const oldLocale = typeof existing?.value === "string" ? existing.value : null;

  if (oldLocale === input.locale) {
    return { ok: true };
  }

  await tx.appSetting.upsert({
    where: { key: APP_SETTING_UI_LOCALE_KEY },
    create: { key: APP_SETTING_UI_LOCALE_KEY, value: input.locale },
    update: { value: input.locale },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.APP_SETTING,
    entityId: APP_SETTING_UI_LOCALE_KEY,
    action: AUDIT_ACTION.SETTINGS_LANGUAGE_CHANGED,
    oldValue: oldLocale === null ? undefined : { locale: oldLocale },
    newValue: { locale: input.locale },
  });

  return { ok: true };
}

export async function updateAppLanguage(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = updateAppLanguageInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const result = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return updateAppLanguageInTransaction(tx, actorUserId, parsed.data);
  });

  if (result.ok) {
    updateTag(CACHE_TAGS.UI_LOCALE);
  }
  return result;
}
