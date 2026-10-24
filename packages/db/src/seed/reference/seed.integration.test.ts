/**
 * Integration test of the reference seed against the DEV database (decision of 2026-10-11: the
 * dev Neon database is the test database). Safe by construction: the seed is idempotent, the test
 * deletes nothing, and it refuses to run unless APP_ENV=dev AND the DB marker says `dev`.
 * Without APP_ENV / DIRECT_URL (CI, a fresh clone) the whole suite is skipped.
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../../client";
import { ENV_GUARD_REFUSAL } from "../../env-guard";
import type { PrismaClient } from "../../generated/prisma/client";
import { ACHIEVEMENT_CATALOG, ensureAchievementCatalog } from "./achievement-catalog";
import { BIBLE_BOOKS } from "./bible-books";
import { seedReference } from "./index";

loadEnv({ path: path.resolve(import.meta.dirname, "../../../../../.env"), quiet: true });

const enabled = process.env.APP_ENV === "dev" && Boolean(process.env.DIRECT_URL);

describe.skipIf(!enabled)("reference seed on the dev database", () => {
  let prisma: PrismaClient;

  const counts = async () => ({
    organizations: await prisma.organization.count(),
    translations: await prisma.bibleTranslation.count(),
    books: await prisma.bibleBook.count(),
    achievements: await prisma.achievement.count(),
    tiers: await prisma.achievementTier.count(),
    seedRuns: await prisma.auditLog.count({ where: { action: "seed.run" } }),
  });

  beforeAll(async () => {
    prisma = createPrismaClient(process.env.DIRECT_URL ?? "");
    // First run may write the marker; it also proves the guard accepts dev/dev.
    await seedReference(prisma, "dev");
  }, 120_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates the reference set (seed_data_spec §6)", async () => {
    const now = await counts();
    expect(now.organizations).toBe(1);
    expect(now.translations).toBe(2);
    expect(now.books).toBe(66);
    expect(now.achievements).toBe(ACHIEVEMENT_CATALOG.length);
    expect(ACHIEVEMENT_CATALOG.filter((a) => a.kind === "REWARD")).toHaveLength(8);
    expect(ACHIEVEMENT_CATALOG.filter((a) => a.kind === "PENALTY")).toHaveLength(3);
    expect(now.tiers).toBe(ACHIEVEMENT_CATALOG.reduce((sum, a) => sum + a.tiers.length, 0));
    expect(BIBLE_BOOKS.map((b) => b.sortOrder)).toEqual(Array.from({ length: 66 }, (_, i) => i + 1));
  });

  it("records the environment marker once", async () => {
    const marker = await prisma.appSetting.findUnique({ where: { key: "db_environment" } });
    expect(marker?.value).toBe("dev");
  });

  it("is idempotent: a repeat run changes nothing and writes no audit record", async () => {
    const before = await counts();
    const report = await seedReference(prisma, "dev");
    expect(report.total).toEqual({ created: 0, updated: 0 });
    expect(report.audited).toBe(false);
    expect(await counts()).toEqual(before);
  }, 120_000);

  it("serializes two parallel runs without duplicates", async () => {
    const before = await counts();
    const reports = await Promise.all([seedReference(prisma, "dev"), seedReference(prisma, "dev")]);
    for (const report of reports) {
      expect(report.total).toEqual({ created: 0, updated: 0 });
    }
    expect(await counts()).toEqual(before);
  }, 120_000);

  it("does not overwrite catalog points or penalty threshold after manual edits (§6.4)", async () => {
    const verses = await prisma.achievement.findUniqueOrThrow({ where: { code: "verses" } });
    const tier1 = await prisma.achievementTier.findUniqueOrThrow({
      where: { achievementId_tier: { achievementId: verses.id, tier: 1 } },
    });
    const behavior = await prisma.achievement.findUniqueOrThrow({ where: { code: "behavior" } });

    await prisma.achievementTier.update({
      where: { id: tier1.id },
      data: { points: tier1.points + 99 },
    });
    await prisma.achievement.update({
      where: { id: behavior.id },
      data: { threshold: (behavior.threshold ?? 0) - 7 },
    });

    const editedTierPoints = tier1.points + 99;
    const editedThreshold = (behavior.threshold ?? 0) - 7;

    await prisma.$transaction(async (tx) => {
      await ensureAchievementCatalog(tx);
    });

    const tierAfter = await prisma.achievementTier.findUniqueOrThrow({ where: { id: tier1.id } });
    const behaviorAfter = await prisma.achievement.findUniqueOrThrow({ where: { id: behavior.id } });
    expect(tierAfter.points).toBe(editedTierPoints);
    expect(behaviorAfter.threshold).toBe(editedThreshold);
  }, 60_000);

  it("refuses APP_ENV=prod against a dev database and writes nothing (INV-24)", async () => {
    const before = await counts();
    await expect(seedReference(prisma, "prod")).rejects.toMatchObject({
      reason: ENV_GUARD_REFUSAL.MARKER_MISMATCH,
    });
    expect(await counts()).toEqual(before);
  });
});
