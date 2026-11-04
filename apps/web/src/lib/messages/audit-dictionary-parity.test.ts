import { AUDIT_ACTION, AUDIT_ENTITY_TYPE } from "@sunschool/domain";
import { describe, expect, it } from "vitest";

import { resolveAuditActionLabel } from "@/data/audit/audit-resolve-labels.server";
import adminEn from "@/lib/messages/en/admin.json";
import adminRu from "@/lib/messages/ru/admin.json";
import { safeAdminMessage } from "@/lib/messages/safe-admin-message";

const readAuditLabel = (
  dictionary: typeof adminRu,
  group: "entity_types" | "actions",
  key: string,
): string | undefined => {
  const section = dictionary.audit?.[group];
  if (!section || typeof section !== "object") return undefined;
  const value = (section as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
};

describe("audit dictionary parity", () => {
  it("maps every AUDIT_ENTITY_TYPE to ru/en labels", () => {
    for (const type of Object.values(AUDIT_ENTITY_TYPE)) {
      expect(readAuditLabel(adminRu, "entity_types", type), type).toBeTruthy();
      expect(readAuditLabel(adminEn, "entity_types", type), type).toBeTruthy();
    }
  });

  it("maps every AUDIT_ACTION to ru/en labels", () => {
    for (const action of Object.values(AUDIT_ACTION)) {
      expect(readAuditLabel(adminRu, "actions", action), action).toBeTruthy();
      expect(readAuditLabel(adminEn, "actions", action), action).toBeTruthy();
    }
  });
});

export const buildAuditFilterEntityTypeLabels = (adminDict: typeof adminRu) =>
  Object.fromEntries(
    Object.values(AUDIT_ENTITY_TYPE).map((type) => [
      type,
      safeAdminMessage(adminDict, `audit.entity_types.${type}`) ?? type,
    ]),
  );

describe("audit page entity type labels", () => {
  it("builds filter labels for every entity type without throwing", () => {
    for (const adminDict of [adminRu, adminEn]) {
      const labels = buildAuditFilterEntityTypeLabels(adminDict);
      for (const type of Object.values(AUDIT_ENTITY_TYPE)) {
        expect(labels[type]).toBeTruthy();
        expect(labels[type]).not.toBe(type);
      }
    }
  });

  it("resolves action labels for the audit filter", () => {
    for (const action of Object.values(AUDIT_ACTION)) {
      expect(resolveAuditActionLabel(adminRu, action)).not.toBe("");
      expect(resolveAuditActionLabel(adminEn, action)).not.toBe("");
    }
  });

  it("keeps Russian audit action labels free of English namespace prefixes", () => {
    const englishLead = /^(Access|Achievement|Analytics|Auth|Bible|Bricks|Calendar|Check|Consent|Deletion|Digest|Family|Lesson|Penalty|School|Seed|Settings)\s*[—-]/;
    for (const action of Object.values(AUDIT_ACTION)) {
      const label = readAuditLabel(adminRu, "actions", action)!;
      expect(label, action).not.toMatch(englishLead);
    }
  });

  it("uses ADR-019 Russian labels for seed entity type and seed.run action", () => {
    const seedEntityLabel = readAuditLabel(adminRu, "entity_types", AUDIT_ENTITY_TYPE.SEED)!;
    const seedRunLabel = readAuditLabel(adminRu, "actions", AUDIT_ACTION.SEED_RUN)!;
    expect(seedEntityLabel).toBe("Начальные данные");
    expect(seedRunLabel).toBe("запущены начальные данные");
    for (const label of [seedEntityLabel, seedRunLabel]) {
      expect(label).not.toMatch(/seed/i);
    }
  });

  it("keeps Russian audit entity type labels in Cyrillic", () => {
    for (const type of Object.values(AUDIT_ENTITY_TYPE)) {
      const label = readAuditLabel(adminRu, "entity_types", type)!;
      expect(label, type).toMatch(/[А-Яа-яЁё]/);
    }
  });
});
