import { describe, expect, it } from "vitest";
import { AUDIT_ACTION } from "../constants/audit-action";
import { serializeAuditValues } from "./serialize-audit-values";

describe("serializeAuditValues (INV-23, L-3, L-7)", () => {
  it("drops names, email, provider ids and tokens", () => {
    const result = serializeAuditValues({
      status: "ACTIVE",
      lastName: "Иванов",
      first_name: "Пётр",
      email: "a@b.c",
      providerAccountId: "123",
      id_token: "xyz",
      roles: ["ADMIN"],
    });
    expect(result).toEqual({ status: "ACTIVE", roles: ["ADMIN"] });
  });

  it("cleans nested objects and arrays", () => {
    const result = serializeAuditValues({
      identity: { provider: "TELEGRAM", providerAccountId: "1", email: "x@y.z", phone: "+70000000000" },
      users: [{ id: "u1", fullName: "A B" }],
    });
    expect(result).toEqual({ identity: { provider: "TELEGRAM" }, users: [{ id: "u1" }] });
  });

  it("returns null when nothing is left", () => {
    expect(serializeAuditValues({ email: "a@b.c" })).toBeNull();
    expect(serializeAuditValues(undefined)).toBeNull();
    expect(serializeAuditValues({})).toBeNull();
  });

  it("serializes dates and skips undefined fields", () => {
    expect(serializeAuditValues({ at: new Date("2026-10-11T00:00:00.000Z"), x: undefined })).toEqual({
      at: "2026-10-11T00:00:00.000Z",
    });
  });
});

describe("AUDIT_ACTION registry", () => {
  it("uses dotted lower-case audit families", () => {
    for (const code of Object.values(AUDIT_ACTION)) {
      expect(code).toMatch(
        /^(access|auth|settings|school|seed|bible|lesson|check|calendar|bricks|deletion)\.[a-z_]+$/,
      );
    }
  });
});
