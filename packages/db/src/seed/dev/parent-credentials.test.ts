import path from "node:path";
import { describe, expect, it } from "vitest";
import { parentCredentialsErrorMessage, resolveParentSeedCredentials } from "./parent-credentials";

const repoRoot = path.resolve(import.meta.dirname, "../../../../../");
/** A root without `.local/dev-secrets.json`, so the file cannot leak into the null cases. */
const emptyRoot = path.join(repoRoot, "no-dev-secrets-here");

describe("resolveParentSeedCredentials (seed_data_spec §8.4)", () => {
  it("returns null when email or password is missing or too short", () => {
    expect(resolveParentSeedCredentials({}, emptyRoot)).toBeNull();
    expect(resolveParentSeedCredentials({ PARENT_EMAIL: "parent@example.test" }, emptyRoot)).toBeNull();
    expect(
      resolveParentSeedCredentials({ PARENT_EMAIL: "parent@example.test", PARENT_PASSWORD: "short" }, emptyRoot),
    ).toBeNull();
  });

  it("accepts valid env credentials", () => {
    expect(
      resolveParentSeedCredentials(
        { PARENT_EMAIL: "parent@example.test", PARENT_PASSWORD: "long-enough-secret" },
        repoRoot,
      ),
    ).toEqual({ email: "parent@example.test", password: "long-enough-secret" });
  });

  it("exposes a stable refusal message", () => {
    expect(parentCredentialsErrorMessage()).toContain("PARENT_EMAIL");
  });
});
