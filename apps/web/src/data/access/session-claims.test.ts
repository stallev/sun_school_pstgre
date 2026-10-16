import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS, USER_ROLE } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { resolveSessionClaimsByUserId } from "./session-claims";

const makeDb = (user: { id: string; status: string; roles: { role: string }[] } | null) =>
  ({
    appUser: {
      findUnique: async () => user,
    },
  }) as unknown as Pick<PrismaClient, "appUser">;

describe("resolveSessionClaimsByUserId (auth_runtime_spec §5.2)", () => {
  it("returns uid, status and roles when the user exists", async () => {
    const db = makeDb({
      id: "u1",
      status: ACCOUNT_STATUS.REQUEST_PENDING,
      roles: [{ role: USER_ROLE.TEACHER }],
    });
    const claims = await resolveSessionClaimsByUserId(db, "u1");
    expect(claims).toEqual({
      uid: "u1",
      status: ACCOUNT_STATUS.REQUEST_PENDING,
      roles: [USER_ROLE.TEACHER],
    });
  });

  it("returns null when the user is missing", async () => {
    const db = makeDb(null);
    expect(await resolveSessionClaimsByUserId(db, "missing")).toBeNull();
  });
});
