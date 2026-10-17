/**
 * Integration test: RST bible loader on dev DB (bible_seed_contract §13). Skipped without APP_ENV=dev
 * and DIRECT_URL. Requires reference seed (66 books, translation row).
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import {
  AUDIT_ACTION,
  BIBLE_TRANSLATION_STATUS,
} from "@sunschool/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../../client";
import type { PrismaClient } from "../../generated/prisma/client";
import { BIBLE_EXPECTED, RST_TRANSLATION_CODE } from "./constants";
import { seedBibleRst } from "./index";
import { seedReference } from "../reference/index";

loadEnv({ path: path.resolve(import.meta.dirname, "../../../../../.env"), quiet: true });

const enabled = process.env.APP_ENV === "dev" && Boolean(process.env.DIRECT_URL);

describe.skipIf(!enabled)("RST bible seed on the dev database", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createPrismaClient(process.env.DIRECT_URL ?? "");
    await seedReference(prisma, "dev");
  }, 120_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("loads RST with §7 counters and READY status", async () => {
    const report = await seedBibleRst(prisma, "dev");
    expect(report.verify.verses).toBe(BIBLE_EXPECTED.versesRst);

    const translation = await prisma.bibleTranslation.findUniqueOrThrow({
      where: { code: RST_TRANSLATION_CODE },
    });
    expect(translation.status).toBe(BIBLE_TRANSLATION_STATUS.READY);

    const finished = await prisma.auditLog.count({
      where: { action: AUDIT_ACTION.BIBLE_LOAD_FINISHED, entityId: translation.id },
    });
    expect(finished).toBeGreaterThan(0);
  }, 600_000);

  it("is idempotent on a second run", async () => {
    const before = await prisma.bibleVerse.count({
      where: { translation: { code: RST_TRANSLATION_CODE } },
    });
    await seedBibleRst(prisma, "dev");
    const after = await prisma.bibleVerse.count({
      where: { translation: { code: RST_TRANSLATION_CODE } },
    });
    expect(after).toBe(before);
    expect(after).toBe(BIBLE_EXPECTED.versesRst);
  }, 600_000);
});
