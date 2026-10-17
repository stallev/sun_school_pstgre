import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE, AUDIT_SOURCE } from "@sunschool/domain";
import type { Prisma } from "../generated/prisma/client";
import { AUDIT_OUTSIDE_TRANSACTION, writeAudit } from "./write-audit";

const makeTx = () => {
  const create = vi.fn(async () => ({}));
  return { tx: { auditLog: { create } } as unknown as Prisma.TransactionClient, create };
};

describe("writeAudit", () => {
  it("writes a serialized record without personal data (INV-23)", async () => {
    const { tx, create } = makeTx();
    await writeAudit(tx, {
      actorUserId: null,
      source: AUDIT_SOURCE.SYSTEM,
      entityType: AUDIT_ENTITY_TYPE.SEED,
      entityId: "reference",
      action: AUDIT_ACTION.SEED_RUN,
      newValue: { created: 3, email: "a@b.c", lastName: "Иванов" },
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        source: "SYSTEM",
        entityType: "seed",
        action: "seed.run",
        newValue: { created: 3 },
        oldValue: undefined,
      }),
    });
  });

  it("refuses a root client that is not a transaction (R-6)", async () => {
    const root = { $disconnect: () => undefined, auditLog: { create: vi.fn() } };
    await expect(
      writeAudit(root as unknown as Prisma.TransactionClient, {
        actorUserId: null,
        source: AUDIT_SOURCE.SYSTEM,
        entityType: AUDIT_ENTITY_TYPE.SEED,
        entityId: "reference",
        action: AUDIT_ACTION.SEED_RUN,
      }),
    ).rejects.toThrow(AUDIT_OUTSIDE_TRANSACTION);
    expect(root.auditLog.create).not.toHaveBeenCalled();
  });
});

describe("audit_log is append-only and has one writer (R-6, INV-16)", () => {
  const root = resolve(import.meta.dirname, "../../../..");
  const SCAN_DIRS = ["packages/db/src", "packages/domain/src", "apps/web/src"];

  const collect = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      if (name === "node_modules" || name === "generated" || name === ".next") return [];
      const full = join(dir, name);
      return statSync(full).isDirectory() ? collect(full) : /\.(ts|tsx)$/.test(name) ? [full] : [];
    });

  const files = SCAN_DIRS.flatMap((dir) => collect(join(root, dir)));
  const writerFile = "packages/db/src/audit/write-audit.ts";
  const mergeAuditActorReassignFile = "packages/db/src/audit/reassign-audit-actors-for-merge.ts";
  const purgeDevTelegramByPhoneScript = "packages/db/src/scripts/purge-dev-telegram-by-phone.ts";

  it("scans a non-empty set of sources", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it("no code updates or deletes audit_log", () => {
    const offenders = files.filter((file) => {
      const rel = relative(root, file).replaceAll("\\", "/");
      if (rel === purgeDevTelegramByPhoneScript) return false;
      return /auditLog\s*\.\s*(update|updateMany|delete|deleteMany|upsert)\b/.test(readFileSync(file, "utf8"));
    });
    expect(offenders.map((f) => relative(root, f))).toEqual([]);
  });

  it("no raw SQL writes audit_log", () => {
    const offenders = files.filter((file) => {
      const rel = relative(root, file).replaceAll("\\", "/");
      if (rel === mergeAuditActorReassignFile || rel === purgeDevTelegramByPhoneScript) return false;
      return /(insert\s+into|update|delete\s+from)\s+"?audit_log"?/i.test(readFileSync(file, "utf8"));
    });
    expect(offenders.map((f) => relative(root, f).replaceAll("\\", "/"))).toEqual([]);
  });

  it("only write-audit.ts creates audit_log rows", () => {
    const writers = files
      .filter((file) => /auditLog\s*\.\s*(create|createMany)\b/.test(readFileSync(file, "utf8")))
      .map((f) => relative(root, f).replaceAll("\\", "/"))
      // this test file mentions the pattern in a regex literal
      .filter((f) => !f.endsWith("write-audit.test.ts"));
    expect(writers).toEqual([writerFile]);
  });
});
