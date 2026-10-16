import { describe, expect, it } from "vitest";
import { adminSeedInputSchema, credentialsLoginSchema } from "./credentials";

describe("credentials schemas", () => {
  it("normalises the email of a login", () => {
    expect(credentialsLoginSchema.parse({ email: "  Admin@Example.ORG ", password: "x" }).email).toBe("admin@example.org");
  });

  it("rejects an empty password or a bad email at login", () => {
    expect(credentialsLoginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(credentialsLoginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });

  it("requires a 12-character password for the seeded admin", () => {
    expect(adminSeedInputSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(false);
    expect(adminSeedInputSchema.safeParse({ email: "a@b.co", password: "long-enough-pw" }).success).toBe(true);
  });
});
