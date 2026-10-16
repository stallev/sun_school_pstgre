import { describe, expect, it, vi } from "vitest";
import {
  assertDbEnvironment,
  decideEnvGuard,
  ENV_GUARD_REFUSAL,
  EnvGuardError,
  type EnvGuardReader,
} from "./env-guard";

const WRITE = { allowMarkerWrite: true };
const NO_WRITE = { allowMarkerWrite: false };

describe("decideEnvGuard (INV-24)", () => {
  it("passes when APP_ENV equals the marker", () => {
    expect(decideEnvGuard("dev", "dev", NO_WRITE)).toEqual({ kind: "ok", environment: "dev" });
    expect(decideEnvGuard("prod", "prod", NO_WRITE)).toEqual({ kind: "ok", environment: "prod" });
  });

  it("refuses APP_ENV=prod against a dev marker and vice versa", () => {
    expect(decideEnvGuard("prod", "dev", WRITE)).toEqual({
      kind: "refuse",
      reason: ENV_GUARD_REFUSAL.MARKER_MISMATCH,
    });
    expect(decideEnvGuard("dev", "prod", WRITE)).toEqual({
      kind: "refuse",
      reason: ENV_GUARD_REFUSAL.MARKER_MISMATCH,
    });
  });

  it("refuses a missing or unknown APP_ENV", () => {
    expect(decideEnvGuard(undefined, "dev", WRITE)).toEqual({
      kind: "refuse",
      reason: ENV_GUARD_REFUSAL.APP_ENV_MISSING,
    });
    expect(decideEnvGuard("staging", "dev", WRITE)).toEqual({
      kind: "refuse",
      reason: ENV_GUARD_REFUSAL.APP_ENV_INVALID,
    });
  });

  it("writes the marker only when allowed, otherwise refuses an unmarked database", () => {
    expect(decideEnvGuard("prod", null, WRITE)).toEqual({ kind: "write_marker", environment: "prod" });
    expect(decideEnvGuard("prod", null, NO_WRITE)).toEqual({
      kind: "refuse",
      reason: ENV_GUARD_REFUSAL.MARKER_MISSING,
    });
  });

  it("refuses a corrupted marker", () => {
    expect(decideEnvGuard("dev", "staging", WRITE)).toEqual({
      kind: "refuse",
      reason: ENV_GUARD_REFUSAL.MARKER_INVALID,
    });
  });
});

describe("assertDbEnvironment", () => {
  const readerWith = (value: unknown) => {
    const findUnique = vi.fn(async () => (value === undefined ? null : { value }));
    return { reader: { appSetting: { findUnique } } as EnvGuardReader, findUnique };
  };

  it("does not query the database for an unknown APP_ENV", async () => {
    const { reader, findUnique } = readerWith("dev");
    await expect(assertDbEnvironment(reader, "staging", WRITE)).rejects.toBeInstanceOf(EnvGuardError);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("throws on mismatch and returns the decision otherwise", async () => {
    const mismatch = readerWith("dev");
    await expect(assertDbEnvironment(mismatch.reader, "prod", WRITE)).rejects.toMatchObject({
      reason: ENV_GUARD_REFUSAL.MARKER_MISMATCH,
    });
    const fine = readerWith("dev");
    await expect(assertDbEnvironment(fine.reader, "dev", NO_WRITE)).resolves.toEqual({
      kind: "ok",
      environment: "dev",
    });
  });

  it("reports an unmarked database as write_marker for the seed", async () => {
    const { reader } = readerWith(undefined);
    await expect(assertDbEnvironment(reader, "dev", WRITE)).resolves.toEqual({
      kind: "write_marker",
      environment: "dev",
    });
  });
});
