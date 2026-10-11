import { describe, expect, it } from "vitest";
import { personNameSchema } from "./person-name";
import { registrationInputSchema } from "./registration";

describe("personNameSchema (РГ-3)", () => {
  it("accepts Unicode names with hyphen, apostrophe and space; trims", () => {
    const parsed = personNameSchema.parse({
      lastName: "  Петров-Водкин ",
      firstName: "Д’Артаньян",
      middleName: "Ян Мария",
    });
    expect(parsed.lastName).toBe("Петров-Водкин");
    expect(parsed.middleName).toBe("Ян Мария");
  });

  it("treats an empty middle name as absent", () => {
    expect(personNameSchema.parse({ lastName: "Ли", firstName: "Ан", middleName: " " }).middleName).toBeUndefined();
  });

  it.each([
    ["empty last name", { lastName: "", firstName: "Ан" }, "auth.register.err_name"],
    ["digits", { lastName: "Ли2", firstName: "Ан" }, "auth.register.err_chars"],
    ["symbols", { lastName: "Ли", firstName: "А<н" }, "auth.register.err_chars"],
    ["too long", { lastName: "Я".repeat(51), firstName: "Ан" }, "auth.register.err_name"],
  ])("rejects %s", (_label, input, key) => {
    const result = personNameSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((i) => i.message)).toContain(key);
  });
});

describe("registrationInputSchema", () => {
  const base = { lastName: "Ли", firstName: "Ан", consentAccepted: true as const };

  it("requires consent", () => {
    const result = registrationInputSchema.safeParse({ ...base, consentAccepted: false });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain("auth.register.consent_required");
    }
  });

  it("rejects client-supplied status, consentVersion and userId (strict)", () => {
    for (const extra of [{ status: "ACTIVE" }, { consentVersion: "v9" }, { userId: "u1" }]) {
      expect(registrationInputSchema.safeParse({ ...base, ...extra }).success).toBe(false);
    }
  });

  it("accepts a valid registration", () => {
    expect(registrationInputSchema.safeParse(base).success).toBe(true);
  });
});
