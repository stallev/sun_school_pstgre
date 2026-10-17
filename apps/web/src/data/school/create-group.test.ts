import { describe, expect, it, vi } from "vitest";
import { MUTATION_ERROR_CODES } from "@sunschool/domain";
import { createGroup } from "./create-group";

const orgId = "22222222-2222-4222-8222-222222222222";
const actorUserId = "33333333-3333-4333-8333-333333333333";

describe("createGroup", () => {
  it("returns VALIDATION when active group name is taken", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      },
      grade: {
        findFirst: vi.fn().mockResolvedValue({ id: "existing" }),
        create: vi.fn(),
      },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await createGroup(db as never, actorUserId, {
      name: "Alpha",
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.group.name_taken",
      fields: { name: "admin.group.name_taken" },
    });
  });
});
