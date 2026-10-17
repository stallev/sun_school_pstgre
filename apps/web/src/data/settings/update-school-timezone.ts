import "server-only";
import { updateTag } from "next/cache";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  isValidIanaTimeZone,
  updateSchoolTimezoneInputSchema,
  type MutationResult,
  type UpdateSchoolTimezoneInput,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { mutationFromZodError } from "../access/map-zod-fields";
import { assertAdminActor } from "../school/school-enrollment-shared.server";

const APP_SETTING_SCHOOL_TIMEZONE_KEY = "school_timezone";

type Tx = Prisma.TransactionClient;

async function loadActorOrganizationId(tx: Tx, actorUserId: string): Promise<string | null> {
  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function updateSchoolTimezoneInTransaction(
  tx: Tx,
  actorUserId: string,
  input: UpdateSchoolTimezoneInput,
): Promise<MutationResult> {
  const adminError = await assertAdminActor(tx, actorUserId);
  if (adminError) return adminError;

  if (!isValidIanaTimeZone(input.timeZone)) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.settings.timezone_invalid",
    };
  }

  const existing = await tx.appSetting.findUnique({
    where: { key: APP_SETTING_SCHOOL_TIMEZONE_KEY },
    select: { value: true },
  });
  const oldTimeZone = typeof existing?.value === "string" ? existing.value : null;

  if (oldTimeZone === input.timeZone) {
    return { ok: true };
  }

  await tx.appSetting.upsert({
    where: { key: APP_SETTING_SCHOOL_TIMEZONE_KEY },
    create: { key: APP_SETTING_SCHOOL_TIMEZONE_KEY, value: input.timeZone },
    update: { value: input.timeZone },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.APP_SETTING,
    entityId: APP_SETTING_SCHOOL_TIMEZONE_KEY,
    action: AUDIT_ACTION.SETTINGS_TIMEZONE_CHANGED,
    oldValue: oldTimeZone === null ? undefined : { timeZone: oldTimeZone },
    newValue: { timeZone: input.timeZone },
  });

  return { ok: true };
}

export async function updateSchoolTimezone(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = updateSchoolTimezoneInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const result = await db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return updateSchoolTimezoneInTransaction(tx, actorUserId, parsed.data);
  });

  if (result.ok) {
    updateTag(CACHE_TAGS.SCHOOL_TIMEZONE);
  }
  return result;
}
