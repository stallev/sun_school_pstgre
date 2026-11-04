import { AUDIT_ACTION } from "@sunschool/domain";
import { describe, expect, it } from "vitest";
import adminRu from "@/lib/messages/ru/admin.json";
import { resolveAuditActionLabel } from "./audit-resolve-labels.server";

describe("resolveAuditActionLabel", () => {
  it("returns Russian phrase for known actions", () => {
    expect(resolveAuditActionLabel(adminRu as never, AUDIT_ACTION.CHECK_CORRECTED)).toBe(
      "Исправил проверку ДЗ",
    );
    expect(resolveAuditActionLabel(adminRu as never, AUDIT_ACTION.ACCESS_REGISTRATION_SUBMITTED)).toBe(
      "Подал заявку на доступ",
    );
  });

  it("falls back to action code when label is missing", () => {
    expect(resolveAuditActionLabel({ audit: { actions: {} } } as never, "unknown.action")).toBe(
      "unknown.action",
    );
  });
});
