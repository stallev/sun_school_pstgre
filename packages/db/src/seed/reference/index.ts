import { AUDIT_ACTION, AUDIT_ENTITY_TYPE, AUDIT_SOURCE } from "@sunschool/domain";
import { writeAudit } from "../../audit/write-audit";
import {
  assertDbEnvironment,
  DB_ENVIRONMENT_SETTING_KEY,
  type DbEnvironment,
} from "../../env-guard";
import type { PrismaClient } from "../../generated/prisma/client";
import { ensureAchievementCatalog } from "./achievement-catalog";
import { ensureAppSettings } from "./app-settings";
import { ensureBibleBooks } from "./bible-books";
import { ensureBibleTranslations } from "./bible-translations";
import { ensureOrganization } from "./organization";
import { addCounts, emptyCounts, type SeedCounts } from "./types";

/** Advisory-lock key of the reference seed: two parallel runs serialize instead of duplicating rows. */
const REFERENCE_SEED_LOCK_KEY = "7340125501";

export type ReferenceSeedReport = {
  environment: DbEnvironment;
  markerWritten: boolean;
  steps: Record<string, SeedCounts>;
  total: SeedCounts;
  /** `false` when the database already matched and no `seed.run` record was written (L-4). */
  audited: boolean;
};

/**
 * Set A of seed_data_spec §3: organization, app_setting defaults, translations, 66 books,
 * achievement catalog. Idempotent (create-if-missing for owner-editable rows, upsert by natural key for catalog rows, no TRUNCATE); one transaction; the
 * environment guard runs inside it, after the lock and before the first write.
 */
export async function seedReference(
  prisma: PrismaClient,
  appEnv: string | undefined,
): Promise<ReferenceSeedReport> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${REFERENCE_SEED_LOCK_KEY})`);

      const decision = await assertDbEnvironment(tx, appEnv, { allowMarkerWrite: true });
      let markerWritten = false;
      if (decision.kind === "write_marker") {
        await tx.appSetting.create({
          data: { key: DB_ENVIRONMENT_SETTING_KEY, value: decision.environment },
        });
        markerWritten = true;
      }

      const organization = await ensureOrganization(tx);
      const steps: Record<string, SeedCounts> = {
        organization: { created: organization.created, updated: organization.updated },
        appSettings: await ensureAppSettings(tx),
        bibleTranslations: await ensureBibleTranslations(tx),
        bibleBooks: await ensureBibleBooks(tx),
        achievementCatalog: await ensureAchievementCatalog(tx),
      };
      const total = Object.values(steps).reduce(addCounts, emptyCounts());

      const audited = total.created + total.updated > 0 || markerWritten;
      if (audited) {
        await writeAudit(tx, {
          actorUserId: null,
          source: AUDIT_SOURCE.SYSTEM,
          entityType: AUDIT_ENTITY_TYPE.SEED,
          entityId: "reference",
          action: AUDIT_ACTION.SEED_RUN,
          newValue: { environment: decision.environment, markerWritten, steps, total },
        });
      }

      return { environment: decision.environment, markerWritten, steps, total, audited };
    },
    { maxWait: 20_000, timeout: 120_000 },
  );
}
