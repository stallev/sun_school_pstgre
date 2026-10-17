import { describe, expect, it } from "vitest";
import { assertNivSeedAllowed, NivLicenseGuardError } from "./load-niv";

describe("NIV license guard", () => {
  it("allows dev without --confirm-license", () => {
    expect(() => assertNivSeedAllowed("dev", false)).not.toThrow();
  });

  it("blocks prod without --confirm-license", () => {
    expect(() => assertNivSeedAllowed("prod", false)).toThrow(NivLicenseGuardError);
  });

  it("allows prod with --confirm-license", () => {
    expect(() => assertNivSeedAllowed("prod", true)).not.toThrow();
  });
});
